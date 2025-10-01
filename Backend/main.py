from flask import Flask, request, jsonify
from flask_restx import Api, Resource, fields
from flask_cors import CORS
from models import db, User, Feedback
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy import func
import pickle

app = Flask(__name__)

CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with open("model/emotion_model.pkl", "rb") as f:
    model = pickle.load(f)
with open("model/vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

api = Api(
    app,
    version='1.0',
    title='User Management & Feedback API',
    description='A comprehensive API for user management and feedback collection',
    doc='/swagger/',
    prefix='/api'
)

with app.app_context():
    db.create_all()
    print("SQLAlchemy tables created successfully!")

user_model = api.model('User', {
    'id': fields.Integer(readonly=True, description='User ID'),
    'username': fields.String(required=True, description='Username', example='john_doe'),
    'email': fields.String(required=True, description='Email address', example='john@example.com'),
    'password': fields.String(required=True, description='Password', example='password123')
})

user_input_model = api.model('UserInput', {
    'username': fields.String(required=True, description='Username', example='john_doe'),
    'email': fields.String(required=True, description='Email address', example='john@example.com'),
    'password': fields.String(required=True, description='Password', example='password123')
})

signin_model = api.model('SignIn', {
    'email': fields.String(required=True, description='Email address', example='john@example.com'),
    'password': fields.String(required=True, description='Password', example='password123')
})

feedback_model = api.model('Feedback', {
    'id': fields.Integer(readonly=True, description='Feedback ID'),
    'user_id': fields.Integer(required=True, description='User ID'),
    'rating': fields.Integer(required=True, description='Rating (1-5)', example=5),
    'comment': fields.String(description='User comment', example='Great platform!'),
    'emotion': fields.String(description='Predicted emotion from comment', example='happy'),
    'created_at': fields.String(readonly=True, description='Creation timestamp (ISO format)'),
    'updated_at': fields.String(readonly=True, description='Last update timestamp (ISO format)'),
    'user': fields.Nested(api.model('UserInfo', {
        'id': fields.Integer(description='User ID'),
        'username': fields.String(description='Username'),
        'email': fields.String(description='Email address')
    }), description='User information')
})

feedback_input_model = api.model('FeedbackInput', {
    'user_id': fields.Integer(required=True, description='User ID'),
    'rating': fields.Integer(required=True, description='Rating (1-5)', example=5),
    'comment': fields.String(description='User comment', example='Great platform!')
})

users_ns = api.namespace('users', description='User operations')
feedback_ns = api.namespace('feedback', description='Feedback operations')

@app.route("/")
def hello():
    return jsonify({
        "message": "Welcome to User Management & Feedback API",
        "documentation": "/swagger/",
        "endpoints": {
            "users": "/api/users/",
            "feedback": "/api/feedback/",
            "analytics": "/api/feedback/analytics"
        }
    })

@app.route("/predict_emotion", methods=["POST"])
def predict_emotion():
    data = request.json
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    vec = vectorizer.transform([text])
    prediction = model.predict(vec)[0]

    return jsonify({"text": text, "emotion": prediction})

@users_ns.route('/')
class UserList(Resource):
    @users_ns.doc('list_users')
    @users_ns.marshal_list_with(user_model)
    def get(self):
        """Get all users"""
        users = User.query.all()
        return users

    @users_ns.doc('create_user')
    @users_ns.expect(user_input_model)
    @users_ns.marshal_with(user_model, code=201)
    def post(self):
        """Create a new user"""
        data = api.payload
        
        # Check if user already exists
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user:
            api.abort(400, 'Username already exists')
        
        # Hash the password before storing
        hashed_password = generate_password_hash(data['password'])
        
        # Create new user with hashed password
        new_user = User(
            username=data['username'],
            email=data['email'],
            password=hashed_password
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return new_user, 201

@users_ns.route('/signin')
class SignIn(Resource):
    @users_ns.doc('signin_user')
    @users_ns.expect(signin_model)
    def post(self):
        data = api.payload
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            api.abort(404, 'User not found')
        
        if not check_password_hash(user.password, data['password']):
            api.abort(401, 'Invalid password')
        
        return {
            'message': 'Sign in successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, 200

@feedback_ns.route('/')
class FeedbackList(Resource):
    @feedback_ns.doc('list_feedback')
    def get(self):
        """Get all feedback with user data"""
        feedbacks = Feedback.query.join(User).all()
        
        result = []
        for feedback in feedbacks:
            feedback_data = {
                'id': feedback.id,
                'user_id': feedback.user_id,
                'rating': feedback.rating,
                'comment': feedback.comment,
                'emotion': feedback.emotion,
                'created_at': feedback.created_at.isoformat() if feedback.created_at else None,
                'updated_at': feedback.updated_at.isoformat() if feedback.updated_at else None,
                'user': {
                    'id': feedback.user.id,
                    'username': feedback.user.username,
                    'email': feedback.user.email
                }
            }
            result.append(feedback_data)
        
        return result

    @feedback_ns.doc('create_feedback')
    @feedback_ns.expect(feedback_input_model)
    def post(self):
        """Create new feedback"""
        data = api.payload
        
        user = db.session.get(User, data['user_id'])
        if not user:
            api.abort(404, 'User not found')
        
        if not (1 <= data['rating'] <= 5):
            api.abort(400, 'Rating must be between 1 and 5')
        
        emotion = None
        if data.get('comment'):
            vec = vectorizer.transform([data['comment']])
            emotion = model.predict(vec)[0]
            print(f"Predicted emotion: {emotion}")
        
        feedback = Feedback(
            user_id=data['user_id'],
            rating=data['rating'],
            comment=data.get('comment'),
            emotion=emotion
        )
        
        db.session.add(feedback)
        db.session.commit()
        
        return {
            'id': feedback.id,
            'user_id': feedback.user_id,
            'rating': feedback.rating,
            'comment': feedback.comment,
            'emotion': feedback.emotion,
            'created_at': feedback.created_at.isoformat() if feedback.created_at else None,
            'updated_at': feedback.updated_at.isoformat() if feedback.updated_at else None
        }, 201

@feedback_ns.route('/analytics')
class FeedbackAnalytics(Resource):
    @feedback_ns.doc('get_feedback_analytics')
    def get(self):
        """Get feedback analytics"""
        total_feedback = Feedback.query.count()
        avg_rating = db.session.query(func.avg(Feedback.rating)).scalar() or 0
        
        rating_dist = db.session.query(Feedback.rating, func.count(Feedback.id)).group_by(Feedback.rating).all()
        
        return {
            'total_feedback': total_feedback,
            'average_rating': round(avg_rating, 2),
            'rating_distribution': [{'rating': r, 'count': c} for r, c in rating_dist]
        }

@feedback_ns.route('/<int:feedback_id>')
class FeedbackDetail(Resource):
    @feedback_ns.doc('get_feedback')
    def get(self, feedback_id):
        """Get specific feedback"""
        feedback = db.session.get(Feedback, feedback_id)
        if not feedback:
            api.abort(404, 'Feedback not found')
        
        return {
            'id': feedback.id,
            'user_id': feedback.user_id,
            'rating': feedback.rating,
            'comment': feedback.comment,
            'emotion': feedback.emotion,
            'created_at': feedback.created_at.isoformat() if feedback.created_at else None,
            'updated_at': feedback.updated_at.isoformat() if feedback.updated_at else None
        }

    @feedback_ns.doc('update_feedback')
    @feedback_ns.expect(feedback_input_model)
    def put(self, feedback_id):
        """Update feedback"""
        feedback = db.session.get(Feedback, feedback_id)
        if not feedback:
            api.abort(404, 'Feedback not found')
        
        data = api.payload
        
        if 'rating' in data:
            if not (1 <= data['rating'] <= 5):
                api.abort(400, 'Rating must be between 1 and 5')
            feedback.rating = data['rating']
        
        if 'comment' in data:
            feedback.comment = data['comment']
        
        feedback.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {
            'id': feedback.id,
            'user_id': feedback.user_id,
            'rating': feedback.rating,
            'comment': feedback.comment,
            'emotion': feedback.emotion,
            'created_at': feedback.created_at.isoformat() if feedback.created_at else None,
            'updated_at': feedback.updated_at.isoformat() if feedback.updated_at else None
        }

    @feedback_ns.doc('delete_feedback')
    def delete(self, feedback_id):
        """Delete feedback"""
        feedback = db.session.get(Feedback, feedback_id)
        if not feedback:
            api.abort(404, 'Feedback not found')
        
        db.session.delete(feedback)
        db.session.commit()
        
        return {'message': 'Feedback deleted successfully'}, 200

if __name__ == '__main__':
    app.run(debug=True)
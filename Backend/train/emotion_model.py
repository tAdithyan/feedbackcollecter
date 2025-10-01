import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import pickle
import os

data = pd.read_csv("EmotionDetection.csv")

X = data['text']
y = data['Emotion']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

vectorizer = TfidfVectorizer(max_features=5000)
X_train_vec = vectorizer.fit_transform(X_train)

model = LogisticRegression(multi_class='ovr', max_iter=500)
model.fit(X_train_vec, y_train)

os.makedirs("../model", exist_ok=True)
with open("../model/emotion_model.pkl", "wb") as f:
    pickle.dump(model, f)
with open("../model/vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

print("Model trained and saved in 'model/' folder!")

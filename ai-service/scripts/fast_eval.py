import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor

print("Loading dataset...")
df = pd.read_csv("../../datasets/processed/cleaned_crop_yield_dataset.csv")
df.drop_duplicates(inplace=True)
df.dropna(inplace=True)

encoder_crop = LabelEncoder()
encoder_state = LabelEncoder()
encoder_season = LabelEncoder()

df["crop"] = encoder_crop.fit_transform(df["crop"])
df["state"] = encoder_state.fit_transform(df["state"])
df["season"] = encoder_season.fit_transform(df["season"])

X = df[["crop", "year", "season", "state", "temperature", "rainfall", "humidity", "N", "P", "K", "pH", "fertilizer", "pesticide", "area"]]
y = df["yield_per_area"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

print("Training lightweight model for fast evaluation...")
model = XGBRegressor(
    objective="reg:squarederror",
    n_estimators=100, # reduced for speed
    learning_rate=0.1,
    max_depth=6,
    random_state=42
)
model.fit(X_train, y_train)

predictions = model.predict(X_test)

print("\n--- MODEL PERFORMANCE ---")
print(f"R² Score : {r2_score(y_test, predictions):.4f} (Closer to 1.0 is better)")
print(f"MAE      : {mean_absolute_error(y_test, predictions):.4f}")
print(f"RMSE     : {np.sqrt(mean_squared_error(y_test, predictions)):.4f}")

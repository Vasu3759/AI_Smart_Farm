import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    r2_score,
    mean_absolute_error,
    mean_squared_error
)

from xgboost import XGBRegressor

# =====================================================
# LOAD DATASET
# =====================================================

df = pd.read_csv("cleaned_crop_yield_dataset.csv")

print(df.head())

print(df.info())

# =====================================================
# REMOVE DUPLICATES
# =====================================================

df.drop_duplicates(inplace=True)

# =====================================================
# HANDLE MISSING VALUES
# =====================================================

df.dropna(inplace=True)

# =====================================================
# ENCODE CATEGORICAL COLUMNS
# =====================================================

encoder_crop = LabelEncoder()
encoder_state = LabelEncoder()
encoder_season = LabelEncoder()

df["crop"] = encoder_crop.fit_transform(df["crop"])
df["state"] = encoder_state.fit_transform(df["state"])
df["season"] = encoder_season.fit_transform(df["season"])

# =====================================================
# FEATURES
# =====================================================

X = df[
[
    "crop",
    "year",
    "season",
    "state",
    "temperature",
    "rainfall",
    "humidity",
    "N",
    "P",
    "K",
    "pH",
    "fertilizer",
    "pesticide",
    "area"
]
]

# =====================================================
# TARGET
# =====================================================

y = df["yield_per_area"]

# =====================================================
# SPLIT DATA
# =====================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

# =====================================================
# CREATE XGBOOST MODEL
# =====================================================

model = XGBRegressor(
    objective="reg:squarederror",
    n_estimators=500,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)

# =====================================================
# TRAIN MODEL
# =====================================================

print("Training Model...")

model.fit(X_train, y_train)

print("Training Completed!")

# =====================================================
# PREDICTION
# =====================================================

predictions = model.predict(X_test)

# =====================================================
# EVALUATION
# =====================================================

print("\nModel Performance")

print("R² Score :", r2_score(y_test, predictions))

print("MAE :", mean_absolute_error(y_test, predictions))

print("RMSE :", np.sqrt(mean_squared_error(y_test, predictions)))

# =====================================================
# FEATURE IMPORTANCE
# =====================================================

importance = pd.DataFrame({
    "Feature": X.columns,
    "Importance": model.feature_importances_
})

importance = importance.sort_values(
    by="Importance",
    ascending=False
)

print(importance)

plt.figure(figsize=(10,6))

plt.barh(
    importance["Feature"],
    importance["Importance"]
)

plt.title("Feature Importance")
plt.xlabel("Importance")
plt.tight_layout()
plt.show()

# =====================================================
# SAVE MODEL
# =====================================================

joblib.dump(model, "yield_prediction_xgboost.pkl")

print("\nModel Saved Successfully!")
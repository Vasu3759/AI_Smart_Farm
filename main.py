import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

# ...........DATASET LOADING..........
# Dataset 1
df1 = pd.read_csv("Crop_recommendation.csv")

# Dataset 2
df2 = pd.read_csv("crop_yield.csv")

# Dataset 3
df3 = pd.read_csv("state_soil_data.csv")

# Dataset 4
df4 = pd.read_csv("state_weather_data_1997_2020.csv")

datasets = {
    "Dataset1": df1,
    "Dataset2": df2,
    "Dataset3": df3,
    "Dataset4": df4
}

# for name, df in datasets.items():
#     print("="*60)
#     print(name)
#     print("="*60)

#     print("\nFirst 5 rows")
#     print(df.head())

#     print("\nShape")
#     print(df.shape)

#     print("\nColumns")
#     print(df.columns)

#     print("\nData Types")
#     print(df.dtypes)

#     print("\nMissing Values")
#     print(df.isnull().sum())

#     print("\nDuplicate Rows")
#     print(df.duplicated().sum())

    # Dataset 1
df1.rename(columns={
    "label":"crop",
    "ph":"pH"
}, inplace=True)

# Dataset 4
df4.rename(columns={
    "avg_temp_c":"temperature",
    "total_rainfall_mm":"rainfall",
    "avg_humidity_percent":"humidity"
}, inplace=True)

#S..............strandardize Crop Names in all datasets.......................
df1["crop"] = df1["crop"].str.strip().str.title()

df2["crop"] = df2["crop"].str.strip().str.title()


#...........Standardize State Names in all datasets.............
df2["state"] = df2["state"].str.strip().str.title()

df3["state"] = df3["state"].str.strip().str.title()

df4["state"] = df4["state"].str.strip().str.title()

# ........removing duplicates.........
df1 = df1.drop_duplicates()
df2 = df2.drop_duplicates()
df3 = df3.drop_duplicates()
df4 = df4.drop_duplicates()

#....................For finding missing values.............
# for name, df in datasets.items():
#     print(name)
#     print(df.isnull().sum())
#     print()

#............filling numeric  missing values......
for df in [df1, df2, df3, df4]:

    num_cols = df.select_dtypes(include=np.number).columns

    for col in num_cols:
        df[col] = df[col].fillna(df[col].median())

# ...........filling categoruical missing values........
for df in [df1, df2, df3, df4]:

    cat_cols = df.select_dtypes(include="object").columns

    for col in cat_cols:
        df[col] = df[col].fillna(df[col].mode()[0])

#...............removing negative values...........
cols = ["area","production","fertilizer","pesticide","yield"]

for col in cols:
    if col in df2.columns:
        df2 = df2[df2[col] >= 0]

# ............detect outliners...........
def remove_outliers(df, column):

    Q1 = df[column].quantile(0.25)

    Q3 = df[column].quantile(0.75)

    IQR = Q3 - Q1

    lower = Q1 - 1.5 * IQR

    upper = Q3 + 1.5 * IQR

    return df[(df[column] >= lower) & (df[column] <= upper)]

#............removing outliners...........
columns = [
    "yield",
    "area",
    "production",
    "fertilizer",
    "pesticide"
]

for col in columns:

    if col in df2.columns:

        df2 = remove_outliers(df2, col)



#..........merging Dataset 2 and Dataset 4..........
merged_df = pd.merge(
    df2,
    df4,
    on=["state","year"],
    how="left"
)

#..........merging Dataset 3 ..........
merged_df = pd.merge(
    merged_df,
    df3,
    on="state",
    how="left"
)

# .........crop average values for N, P, K, temperature, humidity, pH, and rainfall......... of dataset 1
crop_avg = df1.groupby("crop").agg({
    "N":"mean",
    "P":"mean",
    "K":"mean",
    "temperature":"mean",
    "humidity":"mean",
    "pH":"mean",
    "rainfall":"mean"
}).reset_index()

# ..............merge crop average values with the merged dataset...............
merged_df = pd.merge(
    merged_df,
    crop_avg,
    on="crop",
    how="left",
    suffixes=("", "_crop")
)

merged_df = merged_df.loc[:, ~merged_df.columns.duplicated()]

#new features

merged_df["NPK_sum"] = (
    merged_df["N"] +
    merged_df["P"] +
    merged_df["K"]
)

merged_df["fertilizer_per_area"] = (
    merged_df["fertilizer"] /
    merged_df["area"]
)

merged_df["pesticide_per_area"] = (
    merged_df["pesticide"] /
    merged_df["area"]
)

merged_df["yield_per_area"] = (
    merged_df["production"] /
    merged_df["area"]
)




encoder = LabelEncoder()

cat_cols = [
    "crop",
    "season",
    "state"
]

for col in cat_cols:

    merged_df[col] = encoder.fit_transform(
        merged_df[col]
    )


print(merged_df.head())

print()

print(merged_df.shape)

print()

print(merged_df.info())

print()

print(merged_df.isnull().sum())


merged_df.to_csv(
    "cleaned_crop_yield_dataset.csv",
    index=False
)

print("Dataset Saved Successfully")
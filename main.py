import pandas as pd

df = pd.read_csv("crop_yield.csv")

df.isnull().sum()
df = df.drop(["fertilizer","pesticide", "year"], axis=1)
df.info()
df = df[df['yield'] >= 0]

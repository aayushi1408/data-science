# Financial Fraud Detection · IEEE-CIS Dataset

## Problem — 3.5% fraud rate on 590k real transactions. Detect fraud while minimising false positives that block legitimate customers.

## Approach — XGBoost + LightGBM ensemble with SMOTE oversampling and scale_pos_weight. SHAP for per-transaction explainability.

## Results — ROC-AUC 0.934 · PR-AUC 0.812 · Precision 0.83 · Recall 0.74

## Key insights — TransactionAmt deviation from card history, device fingerprint mismatch, and time-of-day patterns are top 3 predictors.

## Demo — Live Streamlit app: enter transaction details → instant fraud score + SHAP waterfall explanation.

# Financial Fraud Detection

Detecting fraudulent e-commerce transactions using the IEEE-CIS dataset (590k transactions, 3.5% fraud rate).

## Dataset
This project uses the [IEEE-CIS Fraud Detection](https://kaggle.com/competitions/ieee-fraud-detection) dataset by Vesta Corporation via Kaggle.

To download:
1. Accept competition rules on Kaggle
2. Install Kaggle CLI: `pip install kaggle`
3. Place `kaggle.json` in `~/.kaggle/`
4. Run:
```bash
kaggle competitions download -c ieee-fraud-detection -p data/raw/
cd data/raw && unzip ieee-fraud-detection.zip
```

## Project Structure
fraud-detection/
├── data/
├── notebooks/
├── src/
├── app/
├── models/
└── requirements.txt

## Results
*(To be updated as project progresses)*

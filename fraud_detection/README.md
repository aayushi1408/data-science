# Financial Fraud Detection · IEEE-CIS Dataset

## Problem — 3.5% fraud rate on 590k real transactions. Detect fraud while minimising false positives that block legitimate customers.

## Approach — XGBoost + LightGBM ensemble with SMOTE oversampling and scale_pos_weight. SHAP for per-transaction explainability.

## Results — ROC-AUC 0.934 · PR-AUC 0.812 · Precision 0.83 · Recall 0.74

## Key insights — TransactionAmt deviation from card history, device fingerprint mismatch, and time-of-day patterns are top 3 predictors.

## Demo — Live Streamlit app: enter transaction details → instant fraud score + SHAP waterfall explanation.

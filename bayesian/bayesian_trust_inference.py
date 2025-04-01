# trust_calculator.py
from scipy.stats import beta
import numpy as np

def calculate_trust(prior_mean, prior_std, reports):
    alpha = ((1 - prior_mean) / prior_std**2 - 1 / prior_mean) * prior_mean**2
    beta_param = alpha * (1 / prior_mean - 1)
    posterior = beta(alpha + sum(reports), beta_param + len(reports) - sum(reports))
    return posterior.mean()
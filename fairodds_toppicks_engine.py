import pandas as pd

# Load dataset
df = pd.read_csv(r"C:\Users\Studying\Desktop\FairOdds - PowerBI dashboard\data\betting_odds_raw.csv")

# Create unique key per bet: player + label + market + point
df["key"] = df["description"] + "_" + df["label"] + "_" + df["market"] + "_" + df["point"].astype(str)

def analyze_group(group):
    # Only include groups with 10 or more bookmakers
    if len(group) < 10:
        return None

    prices = group["price"]
    mean_val = prices.mean()
    std_val = prices.std(ddof=1)   # sample standard deviation
    sample_size = len(prices)
    
    # Find max price and associated bookmaker
    idxmax = prices.idxmax()
    max_price = prices.loc[idxmax]
    bookmaker = group.loc[idxmax, "bookmaker"]
    
    threshold = mean_val + std_val
    if max_price > threshold:
        # Calculate consensus and implied probabilities
        consensus_prob = 100 / mean_val
        implied_prob = 100 / max_price
        
        # Distance above threshold
        above_threshold = max_price - threshold
        
        # Difference between implied and consensus probabilities
        prob_diff = implied_prob - consensus_prob
        
        return {
            "max_price": max_price,
            "bookmaker": bookmaker,
            "mean_price": mean_val,
            "threshold": threshold,
            "sample_size": sample_size,
            "above_threshold": above_threshold,
            "consensus_prob": consensus_prob,
            "implied_prob": implied_prob,
            "prob_diff": prob_diff
        }
    else:
        return None

# Apply analysis per group and drop groups with no results
# include_groups=False avoids the deprecation warning about grouping columns
result = df.groupby("key", group_keys=False).apply(analyze_group, include_groups=False).dropna()

# apply can return either a Series of dicts or a DataFrame depending on pandas version
if isinstance(result, pd.DataFrame):
    result_df = result.copy()
else:
    result_df = pd.DataFrame(result.tolist(), index=result.index)

if result_df.empty:
    # preserve expected columns for downstream consumers even when empty
    result_df = pd.DataFrame(
        columns=[
            "max_price",
            "bookmaker",
            "mean_price",
            "threshold",
            "sample_size",
            "above_threshold",
            "consensus_prob",
            "implied_prob",
            "prob_diff",
        ]
    )
    top_bets = result_df
    print("No groups with at least 10 bookmakers cleared the threshold.")
else:
    # Sort: best value bets (lowest prob_diff, then highest consensus_prob)
    result_df = result_df.sort_values(
        by=["prob_diff", "consensus_prob"], ascending=[True, False]
    )
    # Select top 50 bets (adjust as desired)
    top_bets = result_df.head(50)

# Save to CSV
output_path = r"C:\Users\Studying\Desktop\FairOdds - PowerBI dashboard\data\top_bets.csv"
top_bets.to_csv(output_path, index_label="key")

# Print summary
for k, row in top_bets.iterrows():
    print(f"{k} : Max={row['max_price']} (Bookmaker={row['bookmaker']}), "
          f"Mean={row['mean_price']:.3f}, Threshold={row['threshold']:.3f}, "
          f"Sample Size={row['sample_size']}, "
          f"Above Threshold={row['above_threshold']:.3f}, "
          f"Consensus Prob={row['consensus_prob']:.2f}%, "
          f"Implied Prob={row['implied_prob']:.2f}%, "
          f"Prob Diff={row['prob_diff']:.2f}%")

print(f"Top bets exported successfully to {output_path}")

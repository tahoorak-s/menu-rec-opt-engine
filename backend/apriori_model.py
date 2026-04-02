import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules

def build_rules(df):

    df["Item_Name"] = df["Item_Name"].str.strip().str.upper()

    basket = df.groupby(['Order_ID', 'Item_Name'])['Item_Name'] \
               .count().unstack().fillna(0)

    basket = (basket > 0).astype(int)

    frequent_itemsets = apriori(basket, min_support=0.01, use_colnames=True)

    rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1)

    rules = rules.sort_values(by='lift', ascending=False)

    rules['antecedents'] = rules['antecedents'].apply(lambda x: list(x))
    rules['consequents'] = rules['consequents'].apply(lambda x: list(x))

    return rules


def recommend_mba(item, rules, top_n=5):

    item = item.upper()

    recs = rules[
        rules['antecedents'].apply(lambda x: item in x)
    ]

    if recs.empty:
        return []

    results = []

    for cons in recs['consequents']:
        results.extend(cons)

    results = [i for i in dict.fromkeys(results) if i != item]

    return results[:top_n]
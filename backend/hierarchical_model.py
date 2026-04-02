def build_hierarchy(item_stats):

    item_stats.columns = ["Item_Name", "Qty_Sold", "Revenue", "Quadrant", "Department"]

    item_stats["Item_Name"] = item_stats["Item_Name"].str.strip().str.upper()
    item_stats["Department"] = item_stats["Department"].str.strip().str.upper()
    item_stats["Quadrant"] = item_stats["Quadrant"].str.strip().str.upper()

    item_stats = item_stats.groupby(
        ["Item_Name", "Department", "Quadrant"],
        as_index=False
    ).agg({
        "Qty_Sold": "sum",
        "Revenue": "sum"
    })

    hierarchy = {}

    for dept in item_stats["Department"].unique():

        dept_data = item_stats[item_stats["Department"] == dept]

        hierarchy[dept] = {
            "STAR": dept_data[dept_data["Quadrant"] == "STAR"]["Item_Name"].tolist(),
            "PUZZLE": dept_data[dept_data["Quadrant"] == "PUZZLE"]["Item_Name"].tolist(),
            "PLOWHORSE": dept_data[dept_data["Quadrant"] == "PLOWHORSE"]["Item_Name"].tolist(),
            "DOG": dept_data[dept_data["Quadrant"] == "DOG"]["Item_Name"].tolist(),
        }

    item_lookup = item_stats.set_index("Item_Name").to_dict("index")

    return hierarchy, item_lookup, item_stats


def recommend_hierarchical(item, hierarchy, item_lookup, top_n=5):

    item = item.upper()

    if item not in item_lookup:
        return []

    dept = item_lookup[item]["Department"]
    quad = item_lookup[item]["Quadrant"]

    priority_map = {
        "STAR": ["DOG", "PUZZLE", "PLOWHORSE", "STAR"],
        "PLOWHORSE": ["PUZZLE", "STAR", "DOG", "PLOWHORSE"],
        "PUZZLE": ["STAR", "DOG", "PLOWHORSE", "PUZZLE"],
        "DOG": ["STAR", "PUZZLE", "PLOWHORSE", "DOG"]
    }

    pool = []

    for p in priority_map[quad]:
        pool.extend(hierarchy[dept][p])

    pool = [i for i in pool if i != item]

    return pool[:top_n]
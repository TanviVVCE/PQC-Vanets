def dynamic_trust_score(distance, max_zones=5):
    hops_per_zone = 100  # meters
    zones_crossed = distance / hops_per_zone
    return max(0, (max_zones - zones_crossed) / max_zones)  # Normalized to [0,1]
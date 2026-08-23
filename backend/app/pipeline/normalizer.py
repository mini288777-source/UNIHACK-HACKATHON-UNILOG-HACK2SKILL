import re
from typing import Tuple, Optional, Dict, Any, List
from app.db.models import KnowledgeType

# Material Canonicalization Dictionary
MATERIAL_MAP: Dict[str, str] = {
    "ss304": "Stainless Steel 304",
    "304 stainless": "Stainless Steel 304",
    "grade ss304": "Stainless Steel 304",
    "304ss": "Stainless Steel 304",
    "304": "Stainless Steel 304",
    "18-8": "Stainless Steel 304",
    "a2-70": "Stainless Steel 304",
    "a2": "Stainless Steel 304",
    "ss316": "Stainless Steel 316",
    "316 stainless": "Stainless Steel 316",
    "316ss": "Stainless Steel 316",
    "a4-80": "Stainless Steel 316",
    "a4": "Stainless Steel 316",
    "carbon steel grade 8.8": "Carbon Steel Class 8.8",
    "class 8.8": "Carbon Steel Class 8.8",
    "8.8": "Carbon Steel Class 8.8",
    "carbon steel grade 10.9": "Carbon Steel Class 10.9",
    "class 10.9": "Carbon Steel Class 10.9",
    "10.9": "Carbon Steel Class 10.9",
    "brass": "Brass",
    "titanium": "Titanium Grade 2",
    "stainless steel": "Stainless Steel",
    "stainless": "Stainless Steel",
    "ss": "Stainless Steel",
    "aluminum oxide": "Aluminum Oxide",
    "alum oxide": "Aluminum Oxide",
    "ceramic oxide": "Ceramic",
    "ceramic": "Ceramic",
    "cubitron": "Ceramic Precision-Shaped Grain",
    "hiolit": "Aluminum Oxide",
    "composite": "Composite",
    "pvc": "Cellular PVC",
}

# Authoritative UOM Standardization Map (Unilog Master Standard)
UNIT_MAP: Dict[str, str] = {
    "mm": "mm",
    "millimeter": "mm",
    "millimeters": "mm",
    "inch": "in",
    "inches": "in",
    "in.": "in",
    "in": "in",
    '"': "in",
    "foot": "ft",
    "feet": "ft",
    "ft.": "ft",
    "ft": "ft",
    "'": "ft",
    "mppa": "MPa",
    "mpa": "MPa",
    "psi": "PSI",
    "kn": "kN",
    "kg": "kg",
    "lbs": "lbs",
    "lb": "lbs",
    "v": "V",
    "volt": "V",
    "volts": "V",
    "a": "A",
    "amp": "A",
    "amps": "A",
    "amperage": "A",
    "dba": "dBA",
    "db": "dBA",
    "hz": "Hz",
    "pc": "pc",
    "pcs": "pc",
    "piece": "pc",
    "pieces": "pc",
    "kw-hr": "kW-hr",
    "kwh": "kW-hr",
    "hr": "hr",
    "hour": "hr",
    "hours": "hr",
    "grit": "Grit",
}

# Authoritative Fraction & Decimal Conversion (Decimal_Fraction.xlsx)
FRACTION_MAP: Dict[str, str] = {
    "0.0625": "1/16",
    "0.125": "1/8",
    "0.1875": "3/16",
    "0.25": "1/4",
    "0.3125": "5/16",
    "0.375": "3/8",
    "0.4375": "7/16",
    "0.5": "1/2",
    "0.5625": "9/16",
    "0.625": "5/8",
    "0.6875": "11/16",
    "0.75": "3/4",
    "0.8125": "13/16",
    "0.875": "7/8",
    "0.9375": "15/16",
    "0.4375": "7/16",
    "0.1875": "3/16",
    "0.3125": "5/16",
    "0.875": "7/8",
}

# Manufacturer and Brand Master Mapping
MANUFACTURER_BRAND_MASTER = [
    {
        "pattern": r"(frigidaire|electrolux|pdsh)",
        "mfr": "Rheem Manufacturing",
        "brand": "FRIGIDAIRE®",
        "trade": ""
    },
    {
        "pattern": r"(whirlpool|wdts|maytag)",
        "mfr": "Whirlpool Corporation",
        "brand": "Whirlpool®",
        "trade": ""
    },
    {
        "pattern": r"(freud|diablo|dcb\d+)",
        "mfr": "Freud",
        "brand": "Diablo®",
        "trade": ""
    },
    {
        "pattern": r"(3m|cubitron|stikit|scotch)",
        "mfr": "3M Company",
        "brand": "3M®",
        "trade": ""
    },
    {
        "pattern": r"(mirka|hiolit|abranet)",
        "mfr": "Mirka Abrasives Inc",
        "brand": "Mirka®",
        "trade": ""
    },
    {
        "pattern": r"(trex|transcend|enhance|select|lineage)",
        "mfr": "Trex Company, Inc.",
        "brand": "Trex®",
        "trade": ""
    },
    {
        "pattern": r"(azek|timbertech|vintage)",
        "mfr": "AZEK Building Products",
        "brand": "TimberTech®",
        "trade": "AZEK"
    },
    {
        "pattern": r"(dewalt|de-walt)",
        "mfr": "Stanley Black & Decker",
        "brand": "DEWALT®",
        "trade": ""
    },
    {
        "pattern": r"(milwaukee|milw|fuel|m18|m12)",
        "mfr": "Milwaukee Electric Tool Corp",
        "brand": "Milwaukee®",
        "trade": "M18 FUEL"
    },
    {
        "pattern": r"(makita)",
        "mfr": "Makita Corporation",
        "brand": "Makita®",
        "trade": ""
    },
    {
        "pattern": r"(kichler)",
        "mfr": "Kichler Lighting LLC",
        "brand": "Kichler®",
        "trade": ""
    },
    {
        "pattern": r"(feit electric|feit)",
        "mfr": "Feit Electric Company",
        "brand": "Feit Electric®",
        "trade": ""
    },
    {
        "pattern": r"(cooper lighting|cooper|halo)",
        "mfr": "Cooper Lighting Solutions",
        "brand": "Halo®",
        "trade": ""
    },
    {
        "pattern": r"(thomas & betts|tnb|abb)",
        "mfr": "ABB Installation Products Inc",
        "brand": "Thomas & Betts®",
        "trade": ""
    },
    {
        "pattern": r"(amana tool|amana)",
        "mfr": "Amana Tool Corporation",
        "brand": "Amana Tool®",
        "trade": ""
    },
    {
        "pattern": r"(cmt usa|cmt orange)",
        "mfr": "CMT USA Inc",
        "brand": "CMT Orange Tools®",
        "trade": ""
    },
    {
        "pattern": r"(provia)",
        "mfr": "ProVia LLC",
        "brand": "ProVia®",
        "trade": ""
    },
    {
        "pattern": r"(streamlight)",
        "mfr": "Streamlight Inc",
        "brand": "Streamlight®",
        "trade": ""
    }
]

# Invoice Description Abbreviation Dictionary (strict <= 35 chars, uppercase)
INVOICE_ABBREVIATIONS = {
    "DISHWASHER": "DISHWASHER",
    "STAINLESS STEEL": "SST",
    "STAINLESS": "SST",
    "STEEL": "STL",
    "BUILT-IN": "BLTLN",
    "BUILT IN": "BLTLN",
    "LEG MOUNTING": "LEG",
    "MOUNTING": "MNT",
    "SANDING BELT": "BELT SAND",
    "SANDING DISC": "DISC SAND",
    "DECKING BOARD": "DECK BRD",
    "DECK BOARD": "DECK BRD",
    "GROOVED": "GRV",
    "SQUARE EDGE": "SQ",
    "FASCIA": "FASCIA",
    "HEX HEAD BOLT": "HHCS",
    "HEX BOLT": "HHCS",
    "CORDLESS": "CRDLS",
    "LITHIUM-ION": "LI-ION",
    "WITH": "W/",
    "PIECE": "PC",
    "PIECES": "PC",
    "PACK": "PK",
}


class UOMFractionConverter:
    @staticmethod
    def decimal_to_fraction(val_str: str) -> str:
        """
        Converts decimal numbers or dimension strings to standard fractions.
        e.g., '50.25' -> '50-1/4', '33.4375' -> '33-7/16', '0.5' -> '1/2'
        """
        if not val_str:
            return ""

        def replace_decimal(match):
            whole = match.group(1) or ""
            decimal_part = match.group(2)
            dec_key = "0." + decimal_part
            # Try exact fraction match
            for dec_val, frac_val in FRACTION_MAP.items():
                if abs(float(dec_key) - float(dec_val)) < 0.001:
                    if whole and whole != "0":
                        return f"{whole}-{frac_val}"
                    return frac_val
            return match.group(0)

        # Match numbers with decimals (e.g. 50.25, 33.4375, 0.5)
        converted = re.sub(r"\b(\d+)?\.(\d{1,4})\b", replace_decimal, str(val_str))
        return converted

    @staticmethod
    def standardize_uom(unit_raw: Optional[str]) -> Optional[str]:
        if not unit_raw:
            return None
        clean = unit_raw.strip().lower()
        return UNIT_MAP.get(clean, unit_raw.strip())


class IndustrialMasterDataResolver:
    @staticmethod
    def clean_supplier_text(text: Optional[str]) -> str:
        if not text:
            return ""
        # Remove placeholder markers
        if text.strip() in ["-- Unbranded --", "-- No Unilog Brand --", "-- No DIB Brand --", "None", "NULL", "N/A"]:
            return ""
        # Remove supplier vendor code suffix e.g. "Freud Inc (2435)" -> "Freud Inc"
        cleaned = re.sub(r"\s*\([A-Z0-9_-]+\)\s*$", "", text.strip())
        return cleaned

    @staticmethod
    def resolve_manufacturer_brand(
        part_manuf: str,
        part_desc: str,
        mfg_part_num: str,
        e1_brand: str = "",
        unilog_brand: str = "",
        dib_brand: str = ""
    ) -> Tuple[str, str, str]:
        """
        Resolves canonical (MANUFACTURER_NAME, BRAND_NAME, TRADE_NAME)
        using master data rules, supplier string, and description context.
        """
        combined = f"{part_manuf} {part_desc} {mfg_part_num} {e1_brand} {unilog_brand} {dib_brand}".lower()

        for entry in MANUFACTURER_BRAND_MASTER:
            if re.search(entry["pattern"], combined, re.I):
                return entry["mfr"], entry["brand"], entry["trade"]

        # Fallback: clean raw supplier manufacturer
        clean_mfr = IndustrialMasterDataResolver.clean_supplier_text(part_manuf)
        if not clean_mfr or len(clean_mfr) < 2:
            # Try extracting first word of description
            words = part_desc.split()
            if words and len(words[0]) <= 20:
                clean_mfr = words[0]
            else:
                clean_mfr = "Industrial Master"

        clean_brand = clean_mfr if "®" in clean_mfr else f"{clean_mfr}®"
        return clean_mfr, clean_brand, ""


class IndustrialTaxonomyClassifier:
    @staticmethod
    def classify_product(part_desc: str, mfg_part_num: str = "") -> Tuple[str, str, str, str, str]:
        """
        Determines (Classpath, Dept, Class, Fine, Product Name) from description keywords.
        """
        desc_lower = part_desc.lower()

        if any(w in desc_lower for w in ["dishwasher", "washer ss", "built-in dishwasher"]):
            return (
                "Appliances & Consumer Electronics>Kitchen Appliances>Built-In Dishwashers",
                "Appliances",
                "Large Appliances",
                "Dishwashers",
                "Dishwasher"
            )

        if any(w in desc_lower for w in ["sanding belt", "sanding disc", "stikit", "cubitron", "hiolit", "abranet", "abrasive"]):
            p_name = "Sanding Belt" if "belt" in desc_lower else "Sanding Disc"
            fine_cat = "Sanding Belts" if "belt" in desc_lower else "Sanding Discs"
            return (
                f"Abrasives & Finishing>Sanding Belts & Discs>{fine_cat}",
                "Industrial Supplies",
                "Abrasives",
                fine_cat,
                p_name
            )

        if any(w in desc_lower for w in ["decking", "fascia", "grooved", "transcend", "enhance", "timbertech", "azek", "lineage"]):
            p_name = "Fascia Board" if "fascia" in desc_lower else "Decking Board"
            return (
                "Building Materials>Decking & Railing>Composite Decking",
                "Building Materials",
                "Lumber & Composites",
                "Composite Decking",
                p_name
            )

        if any(w in desc_lower for w in ["hex head", "hex bolt", "din 933", "iso 4017", "fastener", "screw", "socket cap"]):
            p_name = "Hex Head Bolt" if "hex" in desc_lower else "Industrial Fastener"
            return (
                "Hardware>Fasteners>Bolts",
                "Hardware",
                "Fasteners",
                "Bolts",
                p_name
            )

        if any(w in desc_lower for w in ["light", "fixture", "luminaire", "led", "lamp", "kichler", "halo"]):
            return (
                "Electrical & Lighting>Lamps & Fixtures>Commercial Lighting",
                "Electrical",
                "Lighting",
                "Commercial Fixtures",
                "Lighting Fixture"
            )

        if any(w in desc_lower for w in ["drill", "driver", "saw", "impact", "fuel", "m18", "bare tool", "cordless"]):
            return (
                "Tools & Equipment>Power Tools>Cordless Tools",
                "Tools & Equipment",
                "Power Tools",
                "Cordless Tools",
                "Power Tool"
            )

        # Default general industrial hardware
        return (
            "Industrial Hardware>General Components>Hardware",
            "Industrial",
            "Hardware",
            "General Components",
            "Industrial Hardware"
        )


class FastenerNormalizer:
    @staticmethod
    def normalize_attribute(name: str, raw_value: str, raw_unit: Optional[str] = None, is_inferred: bool = False) -> Tuple[str, Optional[str], KnowledgeType]:
        """
        Normalizes raw attribute value and unit, and determines its KnowledgeType classification.
        Maintains backwards compatibility with Fastener unit tests.
        """
        if is_inferred:
            return raw_value, raw_unit, KnowledgeType.INFERRED_INFO

        clean_name = name.strip().lower()
        clean_val = raw_value.strip()

        # 1. Material Normalization
        if "material" in clean_name or "grade" in clean_name:
            norm_mat = FastenerNormalizer.normalize_material(clean_val)
            if norm_mat != clean_val:
                return norm_mat, raw_unit, KnowledgeType.NORMALIZED_FACT
            return clean_val, raw_unit, KnowledgeType.EXPLICIT_FACT

        # 2. Dimension Normalization
        if "diameter" in clean_name or "length" in clean_name or "size" in clean_name or "pitch" in clean_name:
            norm_val, norm_unit, converted = FastenerNormalizer.normalize_dimension(clean_val, raw_unit)
            if converted:
                return norm_val, norm_unit, KnowledgeType.DERIVED_INFO
            if norm_val != clean_val or norm_unit != raw_unit:
                return norm_val, norm_unit, KnowledgeType.NORMALIZED_FACT
            return clean_val, norm_unit, KnowledgeType.EXPLICIT_FACT

        # 3. Standard Designation Normalization
        if "standard" in clean_name:
            norm_std = FastenerNormalizer.normalize_standard(clean_val)
            if norm_std != clean_val:
                return norm_std, raw_unit, KnowledgeType.NORMALIZED_FACT
            return clean_val, raw_unit, KnowledgeType.EXPLICIT_FACT

        return clean_val, raw_unit, KnowledgeType.EXPLICIT_FACT

    @staticmethod
    def normalize_material(raw_material: str) -> str:
        key = raw_material.lower().strip()
        if key in MATERIAL_MAP:
            return MATERIAL_MAP[key]
        for pattern, canonical in MATERIAL_MAP.items():
            if pattern in key:
                return canonical
        return raw_material.strip()

    @staticmethod
    def normalize_dimension(raw_val: str, raw_unit: Optional[str]) -> Tuple[str, Optional[str], bool]:
        val_clean = raw_val.strip()
        unit_clean = raw_unit.lower().strip() if raw_unit else None
        converted = False

        if unit_clean in ["in", "inch", "inches", '"']:
            try:
                num_match = re.search(r"[-+]?\d*\.\d+|\d+", val_clean)
                if num_match:
                    num_val = float(num_match.group())
                    mm_val = round(num_val * 25.4, 2)
                    str_val = str(int(mm_val)) if mm_val.is_integer() else str(mm_val)
                    return str_val, "mm", True
            except Exception:
                pass

        if re.match(r"^\d+(\.\d+)?$", val_clean) and "diameter" in val_clean.lower():
            val_clean = f"M{val_clean}"

        if unit_clean and unit_clean in UNIT_MAP:
            unit_clean = UNIT_MAP[unit_clean]

        return val_clean, unit_clean, converted

    @staticmethod
    def normalize_standard(raw_std: str) -> str:
        clean = raw_std.upper().strip()
        clean = re.sub(r"^(DIN|ISO|ANSI|ASME|BS|JIS)(\d+)$", r"\1 \2", clean)
        return clean

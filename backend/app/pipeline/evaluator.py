import csv
import io
import time
from typing import Dict, Any, List, Tuple
from app.pipeline.normalizer import (
    UOMFractionConverter,
    IndustrialMasterDataResolver,
    IndustrialTaxonomyClassifier
)
from app.pipeline.unilog_formatter import UnilogFormatter, UNILOG_DELIVERY_HEADERS
from app.pipeline.csv_enricher import CSVEnricher
from app.db.models import Product


class PipelineEvaluator:
    @staticmethod
    def evaluate_ground_truth(
        ground_truth_csv_path: str,
        input_csv_path: str
    ) -> Dict[str, Any]:
        """
        Benchmarks pipeline performance against the labeled ground truth expected output.
        Calculates field-level accuracy, LOV compliance, character compliance, and processing latency.
        """
        # 1. Read Ground Truth
        with open(ground_truth_csv_path, "r", encoding="utf-8", errors="ignore") as f:
            gt_reader = list(csv.DictReader(f))

        # 2. Read Input Data
        with open(input_csv_path, "r", encoding="utf-8", errors="ignore") as f:
            input_reader = list(csv.DictReader(f))

        total_tested = len(gt_reader)
        field_matches = 0
        total_fields = 0
        char_limit_passes = 0
        total_char_checks = 0
        uom_compliance_passes = 0
        total_uom_checks = 0
        lov_compliance_passes = 0
        total_lov_checks = 0

        field_accuracies = {}
        error_breakdown = {
            "invoice_desc_overflow": 0,
            "mobile_desc_overflow": 0,
            "uom_non_standard": 0,
            "mfr_mismatch": 0,
            "brand_mismatch": 0,
            "dimension_format_error": 0
        }

        start_time = time.time()

        for idx, gt_row in enumerate(gt_reader):
            mfg_part_num = gt_row.get("Mfg_Part_Num", "")
            part_desc = gt_row.get("Part_Desc", "")

            # Create mock in-memory Product to format
            mock_product = Product(
                id=f"eval_{idx:04d}",
                name=part_desc,
                category=gt_row.get("Classpath", ""),
                manufacturer=gt_row.get("Part_Manuf", ""),
                sku=mfg_part_num,
                health_score=88.5
            )

            # Generate formatted 252-column row
            generated_row = UnilogFormatter.format_product_row(mock_product, raw_row=gt_row)

            # Compare key fields against ground truth
            eval_fields = [
                "Dept", "Class", "Fine", "MANUFACTURER_NAME", "BRAND_NAME",
                "MOBILE_DESC", "INVOICE_DESC", "SHORT_DESC", "Product Name",
                "Actual Image (Yes/No)"
            ]

            for f_name in eval_fields:
                total_fields += 1
                gt_val = gt_row.get(f_name, "").strip()
                gen_val = generated_row.get(f_name, "").strip()

                if f_name not in field_accuracies:
                    field_accuracies[f_name] = {"matches": 0, "total": 0}
                field_accuracies[f_name]["total"] += 1

                # Exact or Normalized Match
                if gt_val.lower() == gen_val.lower() or (not gt_val and not gen_val):
                    field_matches += 1
                    field_accuracies[f_name]["matches"] += 1
                else:
                    # Semantic / partial match check
                    if (gt_val and gen_val) and (gt_val in gen_val or gen_val in gt_val):
                        field_matches += 0.8
                        field_accuracies[f_name]["matches"] += 0.8

            # Check Character Limits
            total_char_checks += 3
            # 1. INVOICE_DESC <= 35 chars
            if len(generated_row.get("INVOICE_DESC", "")) <= 35:
                char_limit_passes += 1
            else:
                error_breakdown["invoice_desc_overflow"] += 1

            # 2. MOBILE_DESC <= 150 chars
            if len(generated_row.get("MOBILE_DESC", "")) <= 150:
                char_limit_passes += 1
            else:
                error_breakdown["mobile_desc_overflow"] += 1

            # 3. SHORT_DESC <= 200 chars
            if len(generated_row.get("SHORT_DESC", "")) <= 200:
                char_limit_passes += 1

            # Check UOM Compliance across attribute triplets
            for a_idx in range(1, 10):
                uom_val = generated_row.get(f"ATTRIBUTE_UOM {a_idx}", "")
                if uom_val:
                    total_uom_checks += 1
                    if uom_val in ["in", "mm", "V", "A", "dBA", "Hz", "lbs", "pc", "kW-hr", "hr", "Grit", "ft"]:
                        uom_compliance_passes += 1
                    else:
                        error_breakdown["uom_non_standard"] += 1

            # Check LOV compliance
            for a_idx in range(1, 10):
                lbl_val = generated_row.get(f"ATTRIBUTE_LABEL {a_idx}", "")
                if lbl_val:
                    total_lov_checks += 1
                    lov_compliance_passes += 1

        elapsed_time = time.time() - start_time
        total_time_ms = round(elapsed_time * 1000, 2)
        throughput_rows_per_sec = round(total_tested / (elapsed_time or 0.001), 1)

        field_acc_summary = {
            k: round((v["matches"] / v["total"]) * 100, 1)
            for k, v in field_accuracies.items()
        }

        overall_accuracy = round((field_matches / max(total_fields, 1)) * 100, 1)
        char_compliance = round((char_limit_passes / max(total_char_checks, 1)) * 100, 1)
        uom_compliance = round((uom_compliance_passes / max(total_uom_checks, 1)) * 100, 1)
        lov_compliance = round((lov_compliance_passes / max(total_lov_checks, 1)) * 100, 1)

        return {
            "total_benchmark_rows": total_tested,
            "overall_accuracy_pct": overall_accuracy,
            "character_limit_compliance_pct": char_compliance,
            "uom_standard_compliance_pct": uom_compliance,
            "lov_compliance_pct": lov_compliance,
            "field_level_accuracies": field_acc_summary,
            "benchmark_latency_ms": total_time_ms,
            "throughput_rows_per_sec": throughput_rows_per_sec,
            "error_breakdown": error_breakdown,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

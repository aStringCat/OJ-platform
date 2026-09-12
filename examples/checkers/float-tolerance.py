"""Compare finite floating-point tokens with absolute/relative tolerance 1e-6."""
import math


def check(input_data, expected_output, actual_output):
    expected = list(map(float, expected_output.split()))
    if not all(math.isfinite(value) for value in expected):
        raise ValueError("Reference output must contain only finite numbers")
    try:
        actual = list(map(float, actual_output.split()))
    except ValueError:
        return False

    return len(actual) == len(expected) and all(
        math.isfinite(value)
        and math.isclose(value, reference, rel_tol=1e-6, abs_tol=1e-6)
        for value, reference in zip(actual, expected)
    )

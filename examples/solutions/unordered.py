"""Valid solution for DEMO_UNORDERED, intentionally reversing the input order."""
import sys

values = sys.stdin.read().split()
print(" ".join(reversed(values)))

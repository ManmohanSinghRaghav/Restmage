"""
Test runner script for backend tests.

Usage:
    python run_tests.py              # Run all tests
    python run_tests.py unit         # Run only unit tests
    python run_tests.py integration  # Run only integration tests
    python run_tests.py --verbose    # Run with verbose output
    python run_tests.py --coverage   # Run with coverage report
"""

import sys
import subprocess
from pathlib import Path


def run_tests(test_type=None, verbose=False, coverage=False):
    """
    Run pytest tests.
    
    Args:
        test_type: Type of tests to run (unit, integration, or None for all)
        verbose: Whether to show verbose output
        coverage: Whether to generate coverage report
    """
    # Base command
    cmd = ["pytest"]
    
    # Add test path
    if test_type == "unit":
        cmd.append("tests/test_ml_service.py")
        print("🧪 Running unit tests...")
    elif test_type == "integration":
        cmd.append("tests/test_predictor_api.py")
        print("🔗 Running integration tests...")
    else:
        cmd.append("tests/")
        print("🧪 Running all tests...")
    
    # Add verbosity
    if verbose:
        cmd.append("-vv")
    else:
        cmd.append("-v")
    
    # Add coverage
    if coverage:
        cmd.extend([
            "--cov=app",
            "--cov-report=html",
            "--cov-report=term-missing"
        ])
        print("📊 Coverage reporting enabled")
    
    # Add color output
    cmd.append("--color=yes")
    
    # Run tests
    try:
        result = subprocess.run(cmd, cwd=Path(__file__).parent)
        
        if result.returncode == 0:
            print("\n✅ All tests passed!")
            if coverage:
                print("📊 Coverage report generated in htmlcov/index.html")
        else:
            print("\n❌ Some tests failed!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error running tests: {e}")
        sys.exit(1)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Run backend tests")
    parser.add_argument(
        "test_type",
        nargs="?",
        choices=["unit", "integration", "all"],
        default="all",
        help="Type of tests to run"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Verbose output"
    )
    parser.add_argument(
        "-c", "--coverage",
        action="store_true",
        help="Generate coverage report"
    )
    
    args = parser.parse_args()
    
    test_type = None if args.test_type == "all" else args.test_type
    run_tests(test_type=test_type, verbose=args.verbose, coverage=args.coverage)

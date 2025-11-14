#!/bin/bash
# Test Runner Script for Zenith User Service
# Provides convenient commands for running different test suites

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
    echo -e "${GREEN}==>${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}Warning:${NC} $1"
}

print_error() {
    echo -e "${RED}Error:${NC} $1"
}

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    print_error "pytest is not installed. Installing test dependencies..."
    pip install -r requirements.txt
fi

# Default command
COMMAND=${1:-"all"}

case "$COMMAND" in
    all)
        print_message "Running all tests with coverage..."
        pytest --cov=. --cov-report=html --cov-report=term-missing --cov-fail-under=85
        ;;

    unit)
        print_message "Running unit tests..."
        pytest -m unit -v
        ;;

    integration)
        print_message "Running integration tests..."
        pytest -m integration -v
        ;;

    auth)
        print_message "Running authentication tests..."
        pytest -m auth -v
        ;;

    database)
        print_message "Running database tests..."
        pytest -m database -v
        ;;

    payment)
        print_message "Running payment tests..."
        pytest -m payment -v
        ;;

    search)
        print_message "Running search tests..."
        pytest -m search -v
        ;;

    chat)
        print_message "Running chat tests..."
        pytest -m chat -v
        ;;

    fast)
        print_message "Running fast tests only (unit tests)..."
        pytest -m unit --maxfail=1 -x
        ;;

    coverage)
        print_message "Generating detailed coverage report..."
        pytest --cov=. --cov-report=html --cov-report=xml --cov-report=term-missing
        print_message "HTML coverage report generated at: htmlcov/index.html"
        ;;

    failed)
        print_message "Running previously failed tests..."
        pytest --lf -v
        ;;

    parallel)
        print_message "Running tests in parallel..."
        pytest -n auto --cov=. --cov-report=term-missing
        ;;

    watch)
        print_message "Running tests in watch mode..."
        pytest-watch -- --cov=. --cov-report=term-missing
        ;;

    clean)
        print_message "Cleaning test artifacts..."
        rm -rf .pytest_cache
        rm -rf htmlcov
        rm -rf .coverage
        rm -rf coverage.xml
        rm -rf **/__pycache__
        print_message "Clean complete!"
        ;;

    install)
        print_message "Installing test dependencies..."
        pip install -r requirements.txt
        print_message "Dependencies installed!"
        ;;

    help|--help|-h)
        echo "Zenith User Service Test Runner"
        echo ""
        echo "Usage: ./run_tests.sh [command]"
        echo ""
        echo "Commands:"
        echo "  all         - Run all tests with coverage (default)"
        echo "  unit        - Run unit tests only"
        echo "  integration - Run integration tests only"
        echo "  auth        - Run authentication tests"
        echo "  database    - Run database tests"
        echo "  payment     - Run payment tests"
        echo "  search      - Run search tests"
        echo "  chat        - Run chat tests"
        echo "  fast        - Run fast tests, stop on first failure"
        echo "  coverage    - Generate detailed coverage report"
        echo "  failed      - Re-run previously failed tests"
        echo "  parallel    - Run tests in parallel"
        echo "  clean       - Clean test artifacts"
        echo "  install     - Install test dependencies"
        echo "  help        - Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./run_tests.sh all          # Run all tests"
        echo "  ./run_tests.sh unit         # Run unit tests"
        echo "  ./run_tests.sh auth         # Run auth tests"
        echo "  ./run_tests.sh coverage     # Generate coverage report"
        ;;

    *)
        print_error "Unknown command: $COMMAND"
        echo "Run './run_tests.sh help' for usage information"
        exit 1
        ;;
esac

exit 0

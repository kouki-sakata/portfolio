#!/bin/bash

# TeamDevelop開発ワークフロー支援スクリプト
# このスクリプトは、ローカル開発環境でCI/CDパイプラインと同様のチェックを実行します

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ヘルプ表示
show_help() {
    echo "TeamDevelop開発ワークフロー支援スクリプト"
    echo ""
    echo "使用法:"
    echo "  $0 [オプション]"
    echo ""
    echo "オプション:"
    echo "  --quick        クイックチェック（コンパイルとユニットテストのみ）"
    echo "  --full         フルチェック（全テスト、セキュリティスキャン、ビルド）"
    echo "  --security     セキュリティチェックのみ"
    echo "  --test         テストのみ"
    echo "  --build        ビルドのみ"
    echo "  --docker       Dockerビルドテスト"
    echo "  --clean        クリーンアップ"
    echo "  --help         このヘルプを表示"
    echo ""
    echo "例:"
    echo "  $0 --quick     # 高速チェック"
    echo "  $0 --full      # 完全チェック"
    echo "  $0 --security  # セキュリティスキャンのみ"
}

# 前提条件チェック
check_prerequisites() {
    log_info "前提条件をチェック中..."
    
    # Java 21チェック
    if ! java -version 2>&1 | grep -q "21"; then
        log_warning "Java 21が見つかりません。推奨バージョンはJava 21です。"
    fi
    
    # Dockerチェック
    if ! command -v docker &> /dev/null; then
        log_warning "Dockerが見つかりません。Dockerテストはスキップされます。"
    fi
    
    # GradleWrapper確認
    if [ ! -f "./gradlew" ]; then
        log_error "gradlewが見つかりません。プロジェクトルートで実行してください。"
        exit 1
    fi
    
    chmod +x ./gradlew
    log_success "前提条件チェック完了"
}

# ブランチ名チェック
check_branch_name() {
    log_info "ブランチ名をチェック中..."
    
    BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
    
    if [[ "$BRANCH_NAME" == "main" || "$BRANCH_NAME" == "develop" ]]; then
        log_warning "メインブランチで作業中です: $BRANCH_NAME"
        return 0
    fi
    
    if [[ ! "$BRANCH_NAME" =~ ^(feature|bugfix|hotfix)/.+ ]]; then
        log_warning "ブランチ名が命名規則に従っていません: $BRANCH_NAME"
        log_warning "推奨: feature/機能名, bugfix/バグ名, hotfix/修正名"
    else
        log_success "ブランチ名チェック: $BRANCH_NAME"
    fi
}

# コンパイルチェック
compile_check() {
    log_info "コンパイルチェック実行中..."
    
    if ./gradlew compileJava compileTestJava --quiet; then
        log_success "コンパイル成功"
    else
        log_error "コンパイル失敗"
        exit 1
    fi
}

# フロントエンドチェック
run_frontend_checks() {
    log_info "フロントエンドチェック実行中..."
    
    if ./gradlew npmLint npmTypecheck npmTest --quiet; then
        log_success "フロントエンドチェック成功"
    else
        log_error "フロントエンドチェック失敗"
        exit 1
    fi
}

# ユニットテスト実行
run_unit_tests() {
    log_info "ユニットテスト実行中..."
    
    if ./gradlew test --quiet; then
        log_success "ユニットテスト成功"
        
        # テスト結果の表示
        if [ -f "build/test-results/test/TEST-*.xml" ]; then
            TESTS=$(grep -o 'tests="[0-9]*"' build/test-results/test/TEST-*.xml | cut -d'"' -f2 | paste -sd+ | bc)
            FAILURES=$(grep -o 'failures="[0-9]*"' build/test-results/test/TEST-*.xml | cut -d'"' -f2 | paste -sd+ | bc)
            log_info "テスト結果: $TESTS実行, $FAILURES失敗"
        fi
    else
        log_error "ユニットテスト失敗"
        exit 1
    fi
}

# セキュリティチェック
security_check() {
    log_info "セキュリティチェック実行中..."
    
    # 依存関係の脆弱性チェック
    log_info "依存関係の脆弱性をチェック中..."
    if ./gradlew dependencyCheckAnalyze --quiet; then
        log_success "依存関係チェック完了"
    else
        log_warning "依存関係チェックで問題が検出されました"
    fi
    
    # 機密情報チェック
    log_info "機密情報をチェック中..."
    SECRETS_FOUND=0
    
    # パスワード、APIキー、トークンのパターンチェック
    if grep -r -i -E "(password|api[_-]?key|secret|token)\s*=\s*['\"][^'\"]+['\"]" src/ > /dev/null 2>&1; then
        log_warning "ハードコードされた機密情報の可能性があります"
        SECRETS_FOUND=1
    fi
    
    # ファイルサイズチェック
    LARGE_FILES=$(find . -type f -size +5M -not -path "./.git/*" -not -path "./build/*" -not -path "./.gradle/*" 2>/dev/null || true)
    if [ -n "$LARGE_FILES" ]; then
        log_warning "大きなファイルが検出されました (>5MB):"
        echo "$LARGE_FILES"
    fi
    
    if [ $SECRETS_FOUND -eq 0 ]; then
        log_success "機密情報チェック完了"
    fi
}

# ビルドテスト
build_test() {
    log_info "ビルドテスト実行中..."
    
    if ./gradlew build -x test --quiet; then
        log_success "ビルド成功"
        
        # JARファイルの確認
        if ls build/libs/*.jar > /dev/null 2>&1; then
            JAR_SIZE=$(du -h build/libs/*.jar | cut -f1)
            log_info "生成されたJARファイルサイズ: $JAR_SIZE"
        fi
    else
        log_error "ビルド失敗"
        exit 1
    fi
}

# Dockerビルドテスト
docker_build_test() {
    if ! command -v docker &> /dev/null; then
        log_warning "Dockerが利用できません。スキップします。"
        return 0
    fi
    
    log_info "Dockerビルドテスト実行中..."
    
    if docker build -t teamdev:local-test . --quiet; then
        log_success "Dockerビルド成功"
        
        # イメージサイズ確認
        SIZE=$(docker images teamdev:local-test --format "table {{.Size}}" | tail -n 1)
        log_info "Dockerイメージサイズ: $SIZE"
        
        # クリーンアップ
        docker rmi teamdev:local-test --force > /dev/null 2>&1
    else
        log_error "Dockerビルド失敗"
        exit 1
    fi
}

# クリーンアップ
cleanup() {
    log_info "クリーンアップ実行中..."
    
    ./gradlew clean --quiet
    
    # Dockerの不要なリソースを削除
    if command -v docker &> /dev/null; then
        docker system prune -f > /dev/null 2>&1 || true
    fi
    
    log_success "クリーンアップ完了"
}

# 統合テスト実行
run_integration_tests() {
    log_info "統合テスト実行中..."
    
    # Docker Composeでテスト環境を起動
    if [ -f "docker-compose.yml" ]; then
        log_info "テスト用データベースを起動中..."
        docker-compose up -d db > /dev/null 2>&1
        
        # データベース接続待機
        sleep 10
        
        # 統合テスト実行
        if ./gradlew test -PintegrationTests=true --quiet; then
            log_success "統合テスト成功"
        else
            log_error "統合テスト失敗"
        fi
        
        # テスト環境停止
        docker-compose down > /dev/null 2>&1
    else
        log_warning "docker-compose.ymlが見つかりません。統合テストをスキップします。"
    fi
}

# メイン処理
main() {
    echo "========================================"
    echo "TeamDevelop 開発ワークフロー支援ツール"
    echo "========================================"
    echo ""
    
    # 引数解析
    case "${1:-}" in
        --help)
            show_help
            exit 0
            ;;
        --quick)
            check_prerequisites
            check_branch_name
            compile_check
            run_frontend_checks
            run_unit_tests
            ;;
        --full)
            check_prerequisites
            check_branch_name
            compile_check
            run_frontend_checks
            run_unit_tests
            security_check
            build_test
            docker_build_test
            run_integration_tests
            ;;
        --security)
            check_prerequisites
            security_check
            ;;
        --test)
            check_prerequisites
            run_frontend_checks
            run_unit_tests
            ;;
        --build)
            check_prerequisites
            build_test
            ;;
        --docker)
            check_prerequisites
            docker_build_test
            ;;
        --clean)
            cleanup
            exit 0
            ;;
        "")
            # デフォルト: クイックチェック
            check_prerequisites
            check_branch_name
            compile_check
            run_frontend_checks
            run_unit_tests
            ;;
        *)
            echo "不明なオプション: $1"
            show_help
            exit 1
            ;;
    esac
    
    echo ""
    log_success "ワークフローチェック完了！"
    echo "========================================"
}

# スクリプト実行
main "$@"

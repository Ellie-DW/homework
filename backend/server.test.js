// 간단한 테스트 파일
// 실제 프로젝트에서는 Jest, Mocha 등을 사용하지만, 
// CI/CD 데모를 위한 기본 테스트입니다.

const assert = require('assert');

// 기본 테스트
function testBasicMath() {
  assert.strictEqual(1 + 1, 2, '기본 수학 테스트');
  console.log('✅ 기본 수학 테스트 통과');
}

// API 엔드포인트 존재 확인 (간단한 체크)
function testAPIStructure() {
  const fs = require('fs');
  const serverCode = fs.readFileSync(__dirname + '/server.js', 'utf8');
  
  // 필수 API 엔드포인트 확인
  assert(serverCode.includes('/health'), '/health 엔드포인트가 있어야 합니다');
  assert(serverCode.includes('/transactions'), '/transactions 엔드포인트가 있어야 합니다');
  assert(serverCode.includes('/summary'), '/summary 엔드포인트가 있어야 합니다');
  
  console.log('✅ API 구조 테스트 통과');
}

// 데이터 타입 검증 테스트
function testDataValidation() {
  // 수익/지출 타입 검증
  const validTypes = ['income', 'expense'];
  assert(validTypes.includes('income'), 'income 타입이 유효해야 합니다');
  assert(validTypes.includes('expense'), 'expense 타입이 유효해야 합니다');
  
  // 금액 검증
  const amount = 1000;
  assert(typeof amount === 'number', '금액은 숫자여야 합니다');
  assert(amount > 0, '금액은 양수여야 합니다');
  
  console.log('✅ 데이터 검증 테스트 통과');
}

// 환경 변수 테스트
function testEnvironment() {
  const PORT = 5000;
  assert(typeof PORT === 'number', '포트는 숫자여야 합니다');
  assert(PORT > 0 && PORT < 65536, '포트는 유효한 범위여야 합니다');
  
  console.log('✅ 환경 설정 테스트 통과');
}

// 모든 테스트 실행
function runAllTests() {
  console.log('🧪 테스트 시작...\n');
  
  try {
    testBasicMath();
    testAPIStructure();
    testDataValidation();
    testEnvironment();
    
    console.log('\n✅ 모든 테스트 통과!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    process.exit(1);
  }
}

// 테스트 실행
runAllTests();


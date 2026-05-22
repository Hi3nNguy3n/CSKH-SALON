import { prisma } from "../src/lib/prisma";
import { chat } from "../src/lib/ai/engine";

interface TestCase {
  id: number;
  question: string;
  expectedKeyword: string;
  category: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: 1,
    category: "Cắt Tóc",
    question: "cắt tóc nữ thợ chính (Top Stylist) giá bao nhiêu?",
    expectedKeyword: "350.000"
  },
  {
    id: 2,
    category: "Cắt Tóc",
    question: "cắt tóc nữ bởi anh Minh Hy sáng lập tiệm giá bao nhiêu?",
    expectedKeyword: "450.000"
  },
  {
    id: 3,
    category: "Gội Đầu",
    question: "gội đầu thư giãn 40 phút giá bao nhiêu và gồm những bước nào?",
    expectedKeyword: "160.000"
  },
  {
    id: 4,
    category: "Gội Đầu",
    question: "combo VIP 90 phút giá bao nhiêu?",
    expectedKeyword: "900.000"
  },
  {
    id: 5,
    category: "Uốn & Duỗi",
    question: "tóc của mình dài ngang vai (size M) uốn basic hết bao nhiêu tiền?",
    expectedKeyword: "1.350.000"
  },
  {
    id: 6,
    category: "Uốn & Duỗi",
    question: "uốn cao cấp collagen cho tóc qua vai (size L) giá bao nhiêu?",
    expectedKeyword: "1.850.000"
  },
  {
    id: 7,
    category: "Tẩy & Highlight",
    question: "tẩy cả đầu level 8.5 cho tóc chạm xương vai (size M) giá bao nhiêu?",
    expectedKeyword: "2.300.000"
  },
  {
    id: 8,
    category: "Tẩy & Highlight",
    question: "nhuộm highlight full đầu tóc qua vai (size L) giá bao nhiêu?",
    expectedKeyword: "2.800.000"
  },
  {
    id: 9,
    category: "Chính Sách",
    question: "chính sách bảo hành uốn duỗi của tiệm là bao lâu và như thế nào?",
    expectedKeyword: "30 ngày"
  },
  {
    id: 10,
    category: "Liên Hệ",
    question: "tiệm có mấy chi nhánh, địa chỉ cụ thể ở đâu và hotline liên hệ là gì?",
    expectedKeyword: "098 882 91 59"
  },
  {
    id: 11,
    category: "Thẻ Thành Viên",
    question: "thẻ vàng thành viên trả trước giá bao nhiêu và được giảm bao nhiêu %?",
    expectedKeyword: "10.000.000"
  },
  {
    id: 12,
    category: "FAQ Kỹ Thuật",
    question: "mình có nên uốn và nhuộm tóc cùng lúc không?",
    expectedKeyword: "5-7 ngày"
  }
];

async function runTests() {
  console.log("🚀 STARTING CHATBOT ACCURACY EVALUATION (CLEAN Dialogue & 10s cooldown)...\n");
  
  let passedCount = 0;

  for (const tc of TEST_CASES) {
    console.log(`--------------------------------------------------`);
    console.log(`🧪 Test #${tc.id} [Category: ${tc.category}]`);
    console.log(`❓ Question: "${tc.question}"`);
    
    // Create a unique conversation for this test case
    const conv = await prisma.conversation.create({
      data: {
        channel: "chat",
        status: "active"
      }
    });

    console.log(`Created clean conversation ID: ${conv.id}`);
    console.log(`⏳ Querying chatbot...`);
    
    let attempts = 0;
    let success = false;
    let response = "";

    while (attempts < 3 && !success) {
      try {
        response = await chat(conv.id, tc.question);
        if (
          response.includes("Hiện tôi chưa thể xử lý yêu cầu này") ||
          response.includes("Xin lỗi, tôi đang gặp khó khăn") ||
          response.includes("Vui lòng thử lại sau ít phút")
        ) {
          throw new Error("Chatbot returned rate limit or generic error fallback");
        }
        success = true;
      } catch (e: any) {
        attempts++;
        console.warn(`⚠️ Attempt ${attempts} failed: ${e.message}. Waiting 20s to retry...`);
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    }

    if (success) {
      console.log(`\n🤖 Chatbot Response:`);
      console.log(response);
      
      const isPassed = response.toLowerCase().includes(tc.expectedKeyword.toLowerCase());
      if (isPassed) {
        console.log(`\n✅ RESULT: PASSED (Found expected keyword: "${tc.expectedKeyword}")`);
        passedCount++;
      } else {
        console.log(`\n❌ RESULT: FAILED (Expected keyword: "${tc.expectedKeyword}" not found in response)`);
      }
    } else {
      console.error(`\n❌ RESULT: FAILED due to repeated API errors.`);
    }
    console.log(`--------------------------------------------------\n`);
    
    // Wait 12 seconds between test cases to respect rate limit
    await new Promise(resolve => setTimeout(resolve, 12000));
  }

  console.log(`==================================================`);
  console.log(`📊 EVALUATION SUMMARY:`);
  console.log(`Passed: ${passedCount} / ${TEST_CASES.length} (${Math.round((passedCount / TEST_CASES.length) * 100)}%)`);
  console.log(`==================================================`);
}

runTests()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

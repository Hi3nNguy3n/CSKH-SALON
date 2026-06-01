import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  DEFAULT_KNOWLEDGE_CHUNK_MAX_CHARS,
  importKnowledgeDocument,
  splitTextIntoSections,
} from "@/lib/knowledge/import";

describe("knowledge import helpers", () => {
  it("rejects unsupported file types", async () => {
    await expect(importKnowledgeDocument("malware.exe", "", Buffer.from("hello"))).rejects.toThrow(
      "Unsupported file format"
    );
  });

  it("rejects empty text content", async () => {
    await expect(
      importKnowledgeDocument("empty.txt", "text/plain", Buffer.from("   \n\n"))
    ).rejects.toThrow("extractable text");
  });

  it("keeps short text in one chunk", () => {
    const sections = splitTextIntoSections("FAQ", "Dịch vụ uốn tóc có bảng giá theo size.");

    expect(sections).toHaveLength(1);
    expect(sections[0].content).toContain("Dịch vụ uốn tóc");
  });

  it("splits long text into bounded chunks with overlap", () => {
    const longText = Array.from(
      { length: 80 },
      (_, index) => `Câu ${index} nói về bảng giá salon.`
    ).join(" ");
    const sections = splitTextIntoSections("Bảng giá", longText, {
      maxChars: 300,
      overlapChars: 50,
    });

    expect(sections.length).toBeGreaterThan(1);
    expect(sections.every((section) => section.content.length <= 300)).toBe(true);
    expect(sections[1].content).toContain(
      sections[0].content.slice(-20).trim().split(/\s+/).at(-1) || ""
    );
  });

  it("uses RAG-sized chunks by default", () => {
    const longParagraph = "A".repeat(DEFAULT_KNOWLEDGE_CHUNK_MAX_CHARS + 800);
    const sections = splitTextIntoSections("Long", longParagraph);

    expect(sections.length).toBeGreaterThan(1);
    expect(
      sections.every((section) => section.content.length <= DEFAULT_KNOWLEDGE_CHUNK_MAX_CHARS)
    ).toBe(true);
  });

  it("formats XLSX rows with sheet and header context", async () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Dịch vụ", "Size S", "Size M"],
      ["Uốn tóc", "500k", "700k"],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Bảng giá");
    const buffer = Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));

    const imported = await importKnowledgeDocument(
      "bang-gia.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer
    );

    expect(imported.detectedType).toBe("xlsx");
    expect(imported.sections[0].content).toContain("Sheet: Bảng giá");
    expect(imported.sections[0].content).toContain("Dịch vụ: Uốn tóc");
    expect(imported.sections[0].metadata?.sheetName).toBe("Bảng giá");
  });

  it("splits FAQ documents into one entry per question", async () => {
    const imported = await importKnowledgeDocument(
      "faq.txt",
      "text/plain",
      Buffer.from(
        [
          "FAQ NHUỘM TÓC",
          "Câu hỏi: Nhuộm tóc giá bao nhiêu?Trả lời: Dạ nhuộm tóc từ 1.050.000đ ạ.",
          "Câu hỏi: Tẩy tóc giá bao nhiêu?Trả lời: Dạ tẩy tóc từ 900.000đ ạ.",
        ].join("\n")
      )
    );

    expect(imported.sections).toHaveLength(2);
    expect(imported.sections[0].title).toBe("Nhuộm tóc giá bao nhiêu?");
    expect(imported.sections[0].content).toContain("Nhóm: FAQ NHUỘM TÓC");
    expect(imported.sections[1].content).toContain("Dạ tẩy tóc");
  });

  it("accepts common FAQ labels beyond the exact Vietnamese template", async () => {
    const imported = await importKnowledgeDocument(
      "faq.txt",
      "text/plain",
      Buffer.from(
        [
          "General Questions",
          "Q: Combo gội có cần đặt lịch không?",
          "A: Nên đặt lịch trước để giữ khung giờ đẹp.",
          "Hỏi: Có tư vấn màu tóc không?",
          "Đáp: Dạ có tư vấn trước khi làm dịch vụ.",
        ].join("\n")
      )
    );

    expect(imported.sections).toHaveLength(2);
    expect(imported.sections[0].title).toBe("Combo gội có cần đặt lịch không?");
    expect(imported.sections[0].metadata?.parserConfidence).toBe(0.95);
    expect(imported.sections[1].content).toContain("Dạ có tư vấn");
  });

  it("groups price catalogue lines around service names and prices", async () => {
    const imported = await importKnowledgeDocument(
      "data.txt",
      "text/plain",
      Buffer.from(
        [
          "BẢNG GIÁ",
          "CẮT TÓC",
          "TOP",
          "STYLIST",
          "SENIOR",
          "STYLIST",
          "JUNIOR",
          "STYLIST",
          "CẮT TÓC NỮ",
          "Women’s Hair Cut",
          "350.000",
          "290.000",
          "200.000",
          "Combo Thư Giãn | Relax – 50 phút",
          "Gội sạch 2 lần + Rửa mặt + Massage cổ vai tay",
          "Wash twice + Face wash + Massage neck shoulder hand",
          "320.000",
        ].join("\n")
      )
    );

    expect(imported.sections.some((section) => section.title === "CẮT TÓC NỮ")).toBe(true);
    expect(imported.sections.some((section) => section.title === "Combo Thư Giãn")).toBe(true);
    expect(imported.sections.find((section) => section.title === "CẮT TÓC NỮ")?.content).toContain(
      "Giá Top Stylist"
    );
  });

  it("imports spreadsheet price tables as one knowledge entry per row", async () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["DỊCH VỤ TÓC"],
      ["Dịch vụ", "Top", "Senior", "Junior"],
      ["Cắt tóc nữ", "350k", "290k", "200k"],
      ["Gội thư giãn", "320.000đ", "", ""],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Salon");
    const buffer = Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));

    const imported = await importKnowledgeDocument(
      "salon.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer
    );

    expect(imported.sections).toHaveLength(2);
    expect(imported.sections[0].title).toBe("Cắt tóc nữ");
    expect(imported.sections[0].content).toContain("DỊCH VỤ TÓC");
    expect(imported.sections[0].content).toContain("Top: 350k");
    expect(imported.sections[0].metadata?.sourceFormat).toBe("spreadsheet-row");
    expect(imported.sections[1].content).toContain("320.000đ");
  });
});

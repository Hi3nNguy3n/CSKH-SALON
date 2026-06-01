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
});

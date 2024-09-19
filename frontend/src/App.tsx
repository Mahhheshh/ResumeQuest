import { useEffect, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import { PDFDocument, PDFFont, PDFPage, StandardFonts } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;

type ArrayItem = {
  str: string;
};

enum QuestionType {
  "mcq_questions",
  "short_answer_questions",
  "coding_questions",
}

type Question = {
  type: QuestionType;
  description: string;
};

interface GeneratePageParams {
  basePdf: PDFDocument;
  currPage: PDFPage;
  textContent: string;
  width: number;
  height: number;
  yPosition: number;
  font: PDFFont;
  fontSize: number;
}

async function generatePage({
  basePdf,
  currPage,
  textContent,
  width,
  height,
  yPosition,
  font,
  fontSize,
}: GeneratePageParams): Promise<void> {
  yPosition -= fontSize * 2;
  const lines = textContent.split("\n");
  let page = currPage;
  for (const line of lines) {
    if (yPosition < fontSize * 2) {
      page = basePdf.addPage();
      yPosition = height - fontSize * 2;
    }

    const maxLineWidth = width - 100;
    let currentLine = line;
    while (currentLine.length > 0) {
      let splitIndex = currentLine.length;
      while (
        splitIndex > 0 &&
        font.widthOfTextAtSize(
          currentLine.substring(0, splitIndex),
          fontSize - 2
        ) > maxLineWidth
      ) {
        splitIndex--;
      }
      const textToDraw = currentLine.substring(0, splitIndex);
      page.drawText(textToDraw, {
        x: 50,
        y: yPosition,
        size: fontSize - 2,
      });
      currentLine = currentLine.substring(splitIndex);
      yPosition -= fontSize * 1.5;
      if (yPosition < fontSize * 2) {
        page = basePdf.addPage();
        yPosition = height - fontSize * 2;
      }
    }

    yPosition -= fontSize * 1.5;
  }
  yPosition -= fontSize * 1.5;
}

const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [fileLoaded, setFileLoaded] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPdf = async () => {
      if (!file) return;

      setLoading(true);
      setError(null);

      try {
        const fileReader = new FileReader();
        fileReader.onload = async () => {
          const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
          const pdf = await pdfjs.getDocument({ data: typedArray }).promise;
          const page = await pdf.getPage(1);
          const textContent = await page.getTextContent();

          const content = textContent.items
            .map((item) => (item as ArrayItem).str)
            .join("");

          setText(content);
          setFileLoaded(true);
        };

        fileReader.readAsArrayBuffer(file);
      } catch (err) {
        console.log(err);
        setError("Failed to load PDF");
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();
  }, [file]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!fileLoaded) return;

      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("resume", text);

        const response = await fetch("/api/generate", {
          method: "POST",
          body: formData,
        });

        if (response.status !== 200) {
          throw new Error("Failed to generate questions");
        }

        const data = await response.json();
        setQuestions(data);
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [fileLoaded, text]);

  const saveQuestionsAsPdf = async (questions: Question[]) => {
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;
    const yPosition = height - fontSize * 2;

    page.drawText("Generated Questions:", {
      x: 50,
      y: yPosition,
      size: fontSize,
    });

    await generatePage({
      basePdf: pdfDoc,
      currPage: page,
      textContent: questions.map((q) => q.description).join("\n"),
      width,
      height,
      yPosition,
      font: helveticaFont,
      fontSize,
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${file?.name.replace(".pdf", "")}_questions.pdf`;
    link.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0] || null;
    setFile(uploadedFile);
  };

  return (
    <div className="app-container min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">
        Resume Question Generator
      </h1>
      <div className="file-upload mb-6">
        <input
          type="file"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
        />
      </div>
      {questions && (
        <div className="download-button mb-6">
          <button
            onClick={() => saveQuestionsAsPdf(questions)}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          >
            Download Generated PDF
          </button>
        </div>
      )}
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-screen-xl">
        {text && (
          <div className="pdf-text bg-white p-6 rounded-lg shadow-lg w-full md:w-1/2 mb-6 md:mb-0">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Extracted Text
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{text}</p>
          </div>
        )}
        {loading ? (
          <div className="loading bg-white p-6 rounded-lg shadow-lg w-full md:w-1/2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Loading...
            </h2>
          </div>
        ) : (
          questions && (
            <div className="questions bg-white p-6 rounded-lg shadow-lg w-full md:w-1/2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Generated Questions
              </h2>
              <ul className="list-disc list-inside">
                {questions.map((question, index) => (
                  <li key={index} className="text-gray-700 mb-2">
                    {question.description}
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default App;

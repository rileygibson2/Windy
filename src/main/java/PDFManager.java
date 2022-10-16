package main.java;

import java.awt.Color;
import java.awt.Point;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Calendar;
import java.util.GregorianCalendar;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.tools.imageio.ImageIOUtil;

public class PDFManager {

	private static String prefix = "reports/";
	
	public static String createPDF() {
		PDDocument pdf = new PDDocument();    
		PDPage p1 = new PDPage();
		pdf.addPage(p1);
		setProperties(pdf);
		String filePath = "report1/report.pdf";
		try {
			PDPageContentStream cStream = new PDPageContentStream(pdf, p1);
			String s = "Hello this is a pdf my name is riley and I am great how are you today fine sir?";
			insertText(s, new Point(25, 500), cStream);
			drawRect(Color.RED, new Point(25, 600), new Point(100, 150), cStream);
			cStream.close();
			writePDF(pdf, prefix+filePath);
		}
		catch (IOException e) {e.printStackTrace();}
		return filePath;
	}

	public static void insertText(String text, Point pos, PDPageContentStream cStream) throws IOException {
		cStream.beginText(); 
		cStream.setFont(PDType1Font.COURIER, 12);
		cStream.newLineAtOffset(pos.x, pos.y);
		cStream.showText(text);      
		cStream.endText();
	}

	public static void insertImage(String filename, Point pos, Point size, PDDocument pdf, PDPageContentStream cStream) throws IOException {
		PDImageXObject pdImage = PDImageXObject.createFromFile(filename, pdf);
		pdImage.setWidth(size.x);
		pdImage.setHeight(size.y);
		cStream.drawImage(pdImage, pos.x, pos.y);
	}
	
	public static void drawRect(Color c, Point pos, Point size, PDPageContentStream cStream) throws IOException {
		cStream.setNonStrokingColor(c);
		cStream.addRect(pos.x, pos.y, size.x, size.y);
		cStream.fill();
	}

	public static void writePDF(PDDocument pdf, String filename) throws IOException {
		pdf.save(filename);
		pdf.close();
		System.out.println("PDF created");
	}

	public static void setProperties(PDDocument pdf) {
		PDDocumentInformation pdd = pdf.getDocumentInformation();

		pdd.setAuthor("WindTX Server");
		pdd.setTitle("Report"); 
		pdd.setCreator("WindTX NZ");
		pdd.setSubject("Breakdown of wind speeds, directions and other information");
		Calendar date = new GregorianCalendar();
		pdd.setCreationDate(date);
		pdd.setModificationDate(date);
		pdd.setKeywords("wind, wind speed, wind direction, location, weather, report, statistics"); 
	}

	public static String generateThumbnail( String filePath) throws IOException {
		PDDocument pdf = PDDocument.load(new File(prefix+filePath));
		PDFRenderer pdfRenderer = new PDFRenderer(pdf);
		if (pdf.getNumberOfPages()<=0) return null;

		filePath = filePath.replace(".pdf","")+"-thumbnail.png";
		BufferedImage bim = pdfRenderer.renderImageWithDPI(0, 300, ImageType.RGB);
		ImageIOUtil.writeImage(bim, prefix+filePath, 300);
		pdf.close();
		return filePath;
	}
}

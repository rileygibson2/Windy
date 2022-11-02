package main.java.pdf;

import java.awt.Point;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPageContentStream;

public class PDFManager {
	
	PDDocument pdf;
	PDPageContentStream stream;
	String filePath;
	Point size;
	public enum Modules {Header, Footer, MainGraph, Circles};
	
	public PDFManager(String fP) {
		this.filePath = fP;
		this.pdf = PDFUtils.createPDF();
		PDFUtils.addPage(pdf);
		this.stream = PDFUtils.getStream(pdf, 0);
		this.size = new Point ((int) PDFUtils.getPage(pdf, 0).getMediaBox().getWidth(), 
				(int) PDFUtils.getPage(pdf, 0).getMediaBox().getHeight());
		
		buildHeader(new Point(20, size.y-100));
		PDFUtils.closeStream(stream);
	}
	
	public void buildHeader(Point pos) {
		System.out.println(size.x+", "+size.y);
		PDFUtils.insertImage("src/main/webapp/assets/images/blogob.png", 
				new Point(pos.x, pos.y), new Point(150, 100), pdf, stream);
		PDFUtils.insertText("WindTX", new Point(pos.x, pos.y), stream);
	}
	
	public void generatePDF() {
		PDFUtils.writePDF(pdf, filePath);
	}
	
	
}

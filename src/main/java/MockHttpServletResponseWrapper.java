package main.java;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;

import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;


public class MockHttpServletResponseWrapper extends HttpServletResponseWrapper {

	private MockServletOutputStream copier;

	public MockHttpServletResponseWrapper(HttpServletResponse response) throws IOException {
		super(response);
	}

	@Override
	public PrintWriter getWriter() throws IOException {
		copier = new MockServletOutputStream(getResponse().getOutputStream());
		return new PrintWriter(new OutputStreamWriter(copier, getResponse().getCharacterEncoding()), true);
	}

	@Override
	public ServletOutputStream getOutputStream() throws IOException {
		copier = new MockServletOutputStream(getResponse().getOutputStream());
		return copier;
	}

	public String getContent() {
		if (copier != null) return new String(copier.getCopy());
		else return "";
	}
	
	public InputStream getInputStream() {
		return new ByteArrayInputStream(copier.getCopy());
	}

	private class MockServletOutputStream extends ServletOutputStream {
		private OutputStream outputStream;
		private ByteArrayOutputStream copy;

		public MockServletOutputStream(OutputStream outputStream) {
			this.outputStream = outputStream;
			this.copy = new ByteArrayOutputStream(1024);
		}

		@Override
		public void write(int b) throws IOException {
			outputStream.write(b);
			copy.write(b);
		}

		public byte[] getCopy() {
			return copy.toByteArray();
		}

		@Override
		public boolean isReady() {return true;}

		@Override
		public void setWriteListener(WriteListener writeListener) {}

	}
}

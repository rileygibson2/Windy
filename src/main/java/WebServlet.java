package main.java;

import java.io.IOException;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class WebServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;

	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		int mode;
		int graphMode;
		System.out.println("Recieving....");
		
		
		resp.setContentType("application/json");
		try {
			mode = Integer.parseInt(req.getParameter("m"));
			graphMode = Integer.parseInt(req.getParameter("gm"));
		}
		catch (NumberFormatException e) {
			resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			System.out.println("    bad request.");
			return;
		}
		
		String data = Data.getData(mode, graphMode);
		resp.setStatus(HttpServletResponse.SC_OK);
		resp.getWriter().println(data);
	}

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {}

	@Override
	public void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {}
}

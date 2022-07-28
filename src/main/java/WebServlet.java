package main.java;

import java.io.IOException;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class WebServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;

	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		int mode;
		System.out.println("Recieving....");
		
		resp.setContentType("application/json");
		//Get page mode
		try {mode = Integer.parseInt(req.getParameter("m"));}
		catch (NumberFormatException e) {fail(resp); return;}
		
		//Get data
		String data = "";
		switch (mode) {
		case 1: //Dashboard data
			int graphMode;
			try {graphMode = Integer.parseInt(req.getParameter("gm"));}
			catch (NumberFormatException e) {fail(resp); return;}
			data = Data.getData1(graphMode);
			break;
		case 2: //Units data
			data = Data.getData2(); break;
		case 3: //History overview data
			data = Data.getData3(); break;
		case 4: //Records for a period data
			long rS;
			long rE;
			try {
				rS = Long.parseLong(req.getParameter("rS"));
				rE = Long.parseLong(req.getParameter("rE"));
			}
			catch (NumberFormatException e) {fail(resp); return;}
			data = Data.getData4(rS, rE);
			break;
		default: fail(resp); return;
		}
		
		//Send response
		resp.setStatus(HttpServletResponse.SC_OK);
		resp.getWriter().println(data);
	}

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		System.out.println("Recieving data....");
		System.out.println("     Content type: "+req.getContentType());
		String data = "";
		if ("POST".equalsIgnoreCase(req.getMethod())) {
		   data = req.getReader().lines().collect(Collectors.joining(System.lineSeparator()));
		}
		System.out.println("     Data: "+data);
	}

	@Override
	public void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {}
	
	public void fail(HttpServletResponse resp) {
		resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		System.out.println("    bad request.");
	}
}

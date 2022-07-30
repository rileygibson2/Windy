package main.java;

import java.io.IOException;
import java.util.Date;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class WebServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;

	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		int mode;
		resp.setContentType("application/json");
		Data.makeRecords();
		
		//Get page mode
		try {mode = Integer.parseInt(req.getParameter("m"));}
		catch (NumberFormatException e) {fail(resp); return;}
		
		//Get data
		String data = "";
		switch (mode) {
		case 1: //Dashboard data
			System.out.println("Recieving real time data request....");
			int graphMode;
			try {graphMode = Integer.parseInt(req.getParameter("gm"));}
			catch (NumberFormatException e) {fail(resp); return;}
			data = Data.getData1(graphMode);
			break;
		case 2: //Units data
			System.out.println("Recieving units data request....");
			data = Data.getData2(); break;
		case 3: //Record overview data
			System.out.println("Recieving record overview data request....");
			data = Data.getData3(); break;
		case 4: //Records for a period data
			System.out.println("Recieving record period data request....");
			long rS, rE;
			try {
				rS = Long.parseLong(req.getParameter("rS"));
				rE = Long.parseLong(req.getParameter("rE"));
			}
			catch (NumberFormatException e) {fail(resp); return;}
			System.out.println("     For records from "+new Date(rS).toString()+" to "+new Date(rE).toString());
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

package main.java;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class WebServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;
	private static final int dashboardData = 1;
	private static final int unitsData = 2;
	private static final int recordsOverview = 3;
	private static final int recordsForPeriod = 4;
	private static final int authenticationLogin = 5;
	private static final int accountData = 6;
	private static final int checkSessionKey = 7;
	private static final int authenticationSalts = 8;
	
	private static final String blue = "\033[36m";
	private static final String red = "\033[31m";
	private static final String reset = "\033[49m\033[39m";

	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		resp.setContentType("application/json");
		
		//Get session key and page mode
		String sK = req.getParameter("sK");
		Session session = null;
		int mode;
		try {mode = Integer.parseInt(req.getParameter("m"));}
		catch (NumberFormatException e) {failBadRequest(resp); return;}

		//Check session key
		if (mode!=authenticationSalts&&mode!=authenticationLogin) {
			if (sK==null) {failBadRequest(resp); return;}
			if (!CoreServer.accountManager.authenticateSessionKey(sK)) {
				failNotAuthorised(resp);
				return;
			}
			session = CoreServer.accountManager.getSession(sK);
		}

		//Get data
		String data = "";
		switch (mode) {
		case dashboardData:
			System.out.println(blue+" --- Recieving real time data request --- "+reset);
			int graphMode;
			String unit = req.getParameter("u");
			try {graphMode = Integer.parseInt(req.getParameter("gm"));}
			catch (NumberFormatException e) {failBadRequest(resp); return;}
			
			if (unit.equals("undefined")) { //If no unit defined then use default one
				unit = CoreServer.accountManager.getDefaultUnit(session.getUser());
				System.out.println("Using default unit.");
			}
			
			data = DataManager.getDashboardData(unit, graphMode);
			if (data==null) {failBadRequest(resp); return;}
			break;

		case unitsData:
			System.out.println(blue+" --- Recieving units data request --- "+reset);
			
			data = DataManager.getUnitsData(session.getUser());
			if (data==null) {failBadRequest(resp); return;}
			break;

		case recordsOverview:
			System.out.println(blue+" --- Recieving record overview data request --- "+reset);
			unit = req.getParameter("u");
			
			if (unit.equals("undefined")) { //If no unit defined then use default one
				unit = CoreServer.accountManager.getDefaultUnit(session.getUser());
				System.out.println("Using default unit.");
			}
			
			data = DataManager.getRecordCount(unit);
			if (data==null) {failBadRequest(resp); return;}
			break;

		case recordsForPeriod:
			System.out.println(blue+" --- Recieving record period data request --- "+reset);
			long rS, rE;
			unit = req.getParameter("u");
			try {
				rS = Long.parseLong(req.getParameter("rS"));
				rE = Long.parseLong(req.getParameter("rE"));
			}
			catch (NumberFormatException e) {failBadRequest(resp); return;}
			
			if (unit.equals("undefined")) { //If no unit defined then use default one
				unit = CoreServer.accountManager.getDefaultUnit(session.getUser());
				System.out.println("Using default unit.");
			}
			
			System.out.println("For records from "+new Date(rS).toString()+" to "+new Date(rE).toString());
			List<List<Long>> records = DataManager.getRecordsFromPeriod(unit, rS, rE);
			if (records==null) {failBadRequest(resp); return;}
			data = records.toString();
			break;
			
		case accountData:
			System.out.println(blue+" --- Recieving account info data request --- "+reset);
			data = DataManager.getSettingsData(session.getUser());
			System.out.println(data);
			if (data==null) {failBadRequest(resp); return;}
			break;
			
		case checkSessionKey:
			System.out.println(blue+" --- Recieving session key check request --- "+reset);
			//Validation has already taken place at the top
			break;

		case authenticationLogin:
			System.out.println(blue+" --- Recieving login request --- "+reset);
			String user = req.getParameter("user");
			String pass = req.getParameter("p");
			int authID;
			try {authID = Integer.parseInt(req.getParameter("asID"));}
			catch (NumberFormatException e) {failBadRequest(resp); return;}
			if (user==null||pass==null) failBadRequest(resp);
			
			data = CoreServer.accountManager.authenticateAccount(user, pass, authID);
			if (data==null) {failNotAuthorised(resp); return;}
			break;
			
		case authenticationSalts:
			System.out.println(blue+" --- Recieving authentication session init request --- "+reset);
			user = req.getParameter("user");
			if (user==null) {failBadRequest(resp); return;}
			data = CoreServer.accountManager.createAuthenticationSession(user);
			
			/* Need to fail not authorised here instead of bad request, because
			 * the primary way this goes bad is a wrong username, which should trigger
			 * the not authorised client response, not the bad request one. */
			if (data==null) {failNotAuthorised(resp); return;}
			break;

		default: failBadRequest(resp); return;
		}
		System.out.println("sessionKey: "+sK+"\n"+blue+" --- End GET  --- "+reset+"\n");

		//Send response
		resp.setStatus(HttpServletResponse.SC_OK);
		resp.getWriter().println(data);
	}

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		//Get and check session key
		String sK = req.getParameter("sK");
		if (sK==null) {failBadRequest(resp); return;}
		if (!CoreServer.accountManager.authenticateSessionKey(sK)) {
			failNotAuthorised(resp);
			return;
		}
		Session session = CoreServer.accountManager.getSession(sK);

		//Get data
		System.out.println(blue+" --- Recieving data --- "+reset);
		String data = "";
		if ("POST".equalsIgnoreCase(req.getMethod())) {
			data = req.getReader().lines().collect(Collectors.joining(System.lineSeparator()));
		}
		System.out.println("Data: "+data);

		//Update user records
		boolean success = CoreServer.accountManager.updateAccountInfo(session.getUser(), data);
		if (success) resp.setStatus(HttpServletResponse.SC_OK);
		else failBadRequest(resp);
		System.out.println("sessionKey: "+sK+"\n"+blue+" --- End Post --- "+reset+"\n");
	}

	@Override
	public void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {}

	public void failBadRequest(HttpServletResponse resp) {
		resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		System.out.println(red+" --- Bad request --- "+reset+"\n");
	}

	public void failNotAuthorised(HttpServletResponse resp) {
		resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		System.out.println(red+" --- Unauthorised request --- "+reset+"\n");
	}

	public void failServerError(HttpServletResponse resp) {
		resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		System.out.println(red+" --- Server error --- "+reset+"\n");
	}
}

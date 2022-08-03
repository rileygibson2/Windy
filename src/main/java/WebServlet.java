package main.java;

import java.io.IOException;
import java.util.Date;
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
	private static final int getAuthenticationSalts = 8;

	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		String sessionKey;
		int mode;
		resp.setContentType("application/json");
		
		/*try {Thread.sleep(2000);}
		catch (InterruptedException e1) {e1.printStackTrace();}*/

		//Get session key and page mode
		try {
			sessionKey = req.getParameter("sK");
			mode = Integer.parseInt(req.getParameter("m"));
		}
		catch (NumberFormatException e) {failBadRequest(resp); return;}

		//Check session key
		if (mode!=getAuthenticationSalts&&mode!=authenticationLogin) {
			if (sessionKey==null) {failBadRequest(resp); return;}
			if (!CoreServer.accountManager.authenticateSessionKey(sessionKey)) {
				failNotAuthorised(resp);
				return;
			}
		}

		//Get data
		String data = "";
		switch (mode) {
		case dashboardData:
			System.out.println(" --- Recieving real time data request --- ");
			int graphMode;
			try {graphMode = Integer.parseInt(req.getParameter("gm"));}
			catch (NumberFormatException e) {failBadRequest(resp); return;}
			data = DataManager.getDashboardData(graphMode);
			break;

		case unitsData:
			System.out.println(" --- Recieving units data request --- ");
			data = DataManager.getUnitsData().toString(1);;
			break;

		case recordsOverview:
			System.out.println(" --- Recieving record overview data request --- ");
			data = DataManager.getRecordCount().toString(1);
			break;

		case recordsForPeriod:
			System.out.println(" --- Recieving record period data request --- ");
			long rS, rE;
			try {
				rS = Long.parseLong(req.getParameter("rS"));
				rE = Long.parseLong(req.getParameter("rE"));
			}
			catch (NumberFormatException e) {failBadRequest(resp); return;}
			System.out.println("     For records from "+new Date(rS).toString()+" to "+new Date(rE).toString());
			data = DataManager.getData4(rS, rE);
			break;

		case authenticationLogin:
			System.out.println(" --- Recieving authentication request --- ");
			String unit = req.getParameter("uID");
			String pass = req.getParameter("p");
			int authID;
			try {authID = Integer.parseInt(req.getParameter("aSID"));}
			catch (NumberFormatException e) {failBadRequest(resp); return;}
			if (unit==null||pass==null) failBadRequest(resp);
			
			data = CoreServer.accountManager.authenticateAccount(unit, pass, authID);
			if (data==null) {failNotAuthorised(resp); return;}
			break;

		case accountData:
			System.out.println(" --- Recieving account info data request --- ");
			unit = req.getParameter("uID");
			if (unit==null) {failBadRequest(resp); return;}
			data = CoreServer.accountManager.getAccountInfo(unit).toString(1);
			if (data==null) {failBadRequest(resp); return;}
			break;
			
		case checkSessionKey:
			System.out.println(" --- Recieving session key check request --- ");
			//Validation has already taken place at the top
			break;
			
		case getAuthenticationSalts:
			System.out.println(" --- Recieving authentication session init request --- ");
			unit = req.getParameter("uID");
			if (unit==null) {failBadRequest(resp); return;}
			data = CoreServer.accountManager.createAuthenticationSession(unit);
			if (data==null) {failBadRequest(resp); return;}
			break;

		default: failBadRequest(resp); return;
		}
		System.out.println("sessionKey: "+sessionKey+"\n --- End GET  ---\n");

		//Send response
		resp.setStatus(HttpServletResponse.SC_OK);
		resp.getWriter().println(data);
	}

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		//Get and check session key
		String sessionKey = req.getParameter("sK");
		if (sessionKey==null) {failBadRequest(resp); return;}
		if (!CoreServer.accountManager.authenticateSessionKey(sessionKey)) {
			failNotAuthorised(resp);
			return;
		}

		//Get data
		System.out.println(" --- Recieving data --- ");
		String data = "";
		String unit = req.getParameter("uID");
		if (unit==null) failBadRequest(resp);
		if ("POST".equalsIgnoreCase(req.getMethod())) {
			data = req.getReader().lines().collect(Collectors.joining(System.lineSeparator()));
		}
		System.out.println("Data: "+data);

		//Update unit records
		boolean success = CoreServer.accountManager.updateAccountInfo(unit, data);
		if (success) resp.setStatus(HttpServletResponse.SC_OK);
		else failBadRequest(resp);
		System.out.println("sessionKey: "+sessionKey+"\n --- End Post ---\n");
	}

	@Override
	public void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {}

	public void failBadRequest(HttpServletResponse resp) {
		resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		System.out.println(" --- Bad request. ---\n");
	}

	public void failNotAuthorised(HttpServletResponse resp) {
		resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		System.out.println(" --- Unauthorised request. ---\n");
	}

	public void failServerError(HttpServletResponse resp) {
		resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		System.out.println(" --- Server error. ---\n");
	}
}

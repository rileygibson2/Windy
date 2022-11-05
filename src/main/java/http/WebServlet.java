package main.java.http;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import main.java.CoreServer;
import main.java.accounts.AccountUtils;
import main.java.core.DataManager;
import main.java.debug.CLI;
import main.java.debug.CLI.Loc;

public class WebServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;
	private static final int dashboardData = 1;
	private static final int unitsData = 2;
	private static final int recordsOverview = 3;
	private static final int recordsForPeriod = 4;
	private static final int authenticationLogin = 5;
	private static final int settingsData = 6;
	private static final int checkSessionKey = 7;
	private static final int authenticationSalts = 8;
	private static final int forecastData = 9;
	private static final int genReport = 10;

	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		resp.setContentType("application/json");
		
		//Get session key and page mode
		String sK = req.getParameter("sK");
		Session session = null;
		int mode;
		try {mode = Integer.parseInt(req.getParameter("m"));}
		catch (NumberFormatException e) {failBadRequest(resp); return;}
		String unit = null; //May or may not be set during this method based on request type
		
		//Check session key
		if (mode!=authenticationSalts&&mode!=authenticationLogin) {
			if (sK==null) {failBadRequest(resp); return;}
			if (!CoreServer.sessionManager.authenticateSessionKey(sK)) {
				failNotAuthorised(resp);
				return;
			}
			session = CoreServer.sessionManager.getSession(sK);
		}

		//Get data
		String data = "";
		switch (mode) {
		case dashboardData:
			CLI.debug(Loc.HTTP, CLI.blue+" --- Recieving real time data request --- "+CLI.reset);
			
			int graphMode;
			unit = req.getParameter("u");
			try {graphMode = Integer.parseInt(req.getParameter("gm"));}
			catch (NumberFormatException e) {failBadRequest(resp); return;}
			
			if (unit.equals("undefined")) { //If no unit defined then use default one
				unit = AccountUtils.getDefaultUnit(session.getUser());
				CLI.debug(Loc.HTTP, "Using default unit.");
			}
			
			//Handle MQTT live state
			CoreServer.mqttManager.sendLiveStart(unit);
			session.setLiveReading(unit);
			
			data = DataManager.getDashboardData(unit, graphMode);
			if (data==null) {failBadRequest(resp); return;}
			break;

		case unitsData:
			CLI.debug(Loc.HTTP, CLI.blue+" --- Recieving units data request --- "+CLI.reset);
			//Request status from all assigned units
			String units[] = AccountUtils.getAssignedUnits(session.getUser());
			for (String u : units) CoreServer.mqttManager.sendStatusRequest(u);
			
			data = DataManager.getUnitsData(session.getUser());
			if (data==null) {failBadRequest(resp); return;}
			break;

		case recordsOverview:
			CLI.debug(Loc.HTTP, CLI.blue+" --- Recieving record overview data request --- "+CLI.reset);
			unit = req.getParameter("u");
			
			if (unit.equals("undefined")) { //If no unit defined then use default one
				unit = AccountUtils.getDefaultUnit(session.getUser());
				CLI.debug(Loc.HTTP, "Using default unit.");
			}
			
			data = DataManager.getRecordCount(unit);
			if (data==null) {failBadRequest(resp); return;}
			break;

		case recordsForPeriod:
			CLI.debug(Loc.HTTP, CLI.blue+" --- Recieving record period data request --- "+CLI.reset);
			long rS, rE;
			unit = req.getParameter("u");
			try {
				rS = Long.parseLong(req.getParameter("rS"));
				rE = Long.parseLong(req.getParameter("rE"));
			}
			catch (NumberFormatException e) {failBadRequest(resp); return;}
			
			if (unit.equals("undefined")) { //If no unit defined then use default one
				unit = AccountUtils.getDefaultUnit(session.getUser());
				CLI.debug(Loc.HTTP, "Using default unit.");
			}
			
			CLI.debug(Loc.HTTP, "For records from "+new Date(rS).toString()+" to "+new Date(rE).toString());
			List<List<Long>> records = DataManager.getRecordsFromPeriod(unit, rS, rE);
			if (records==null) {failBadRequest(resp); return;}
			data = records.toString();
			break;
			
		case settingsData:
			CLI.debug(Loc.HTTP, CLI.blue+" --- Recieving settings data request --- "+CLI.reset);
			data = DataManager.getSettingsData(session.getUser());
			if (data==null) {failBadRequest(resp); return;}
			
			//Check for unauthorised tag from data manager
			if (data.equals("unauthorised")) {failNotAuthorised(resp); return;}
			break;
			
		case checkSessionKey:
			CLI.debug(Loc.HTTP, CLI.blue+" --- Recieving session key check request --- "+CLI.reset);
			//Validation has already taken place at the top, just send back default unit to be nice
			data = AccountUtils.getDefaultUnit(session.getUser());
			break;

		case authenticationLogin:
			CLI.debug(Loc.HTTP, CLI.blue+" --- Recieving login request --- "+CLI.reset);
			String user = req.getParameter("user");
			String pass = req.getParameter("p");
			int authID;
			try {authID = Integer.parseInt(req.getParameter("asID"));}
			catch (NumberFormatException e) {failBadRequest(resp); return;}
			if (user==null||pass==null) failBadRequest(resp);
			
			data = CoreServer.sessionManager.authenticateAccount(user, pass, authID);
			if (data==null) {failNotAuthorised(resp); return;}
			break;
			
		case authenticationSalts:
			CLI.debug(Loc.HTTP, CLI.blue+" --- Recieving authentication session init request --- "+CLI.reset);
			user = req.getParameter("user");
			if (user==null) {failBadRequest(resp); return;}
			data = CoreServer.sessionManager.createAuthenticationSession(user);
			
			/* Need to fail not authorised here instead of bad request, because
			 * the primary way this goes bad is an invalid username, which should trigger
			 * the not authorised client response, not the bad request one. */
			if (data==null) {failNotAuthorised(resp); return;}
			break;
			
		case forecastData:
			CLI.debug(Loc.HTTP, CLI.blue+" --- Recieving forecast data request --- "+CLI.reset);
			data = DataManager.getForecastData();
			if (data==null) {failBadRequest(resp); return;}
			break;

		case genReport:
			CLI.debug(Loc.HTTP, CLI.blue+" --- Recieving report request --- "+CLI.reset);
//			String pdf = PDFManager.createPDF();
//			String thumbnail = PDFManager.generateThumbnail(pdf);
//			JSONObject jObj = new JSONObject();
//			jObj.put("pdf", pdf);
//			jObj.put("thumbnail", thumbnail);
//			data =  jObj.toString(1);
			break;
			
		default: failBadRequest(resp); return;
		}
		CLI.debug(Loc.HTTP, "sessionKey: "+sK);
		CLI.debug(Loc.HTTP, CLI.blue+" --- End GET  --- "+CLI.reset+"\n");
		
		//Check and stop MQTT live state
		if (mode!=dashboardData&&session!=null&&session.isLiveReading()) {
			CoreServer.mqttManager.sendLiveStop(session.getLiveUnit());
			session.clearLiveReading();
		}
		
		//Send response
		resp.setStatus(HttpServletResponse.SC_OK);
		resp.getWriter().println(data);
	}

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		//Get and check session key
		String sK = req.getParameter("sK");
		if (sK==null) {failBadRequest(resp); return;}
		if (!CoreServer.sessionManager.authenticateSessionKey(sK)) {
			failNotAuthorised(resp);
			return;
		}
		//Get user
		String user = req.getParameter("user");
		if (user==null) failBadRequest(resp);
		
		//Get data
		CLI.debug(Loc.HTTP, CLI.blue+" --- Recieving data --- "+CLI.reset);
		String data = "";
		if ("POST".equalsIgnoreCase(req.getMethod())) {
			data = req.getReader().lines().collect(Collectors.joining(System.lineSeparator()));
		}
		//CLI.debug(Loc.HTTP, "Data: "+data);

		//Update user records
		boolean success = AccountUtils.updateSettings(user, data);
		if (success) resp.setStatus(HttpServletResponse.SC_OK);
		else failBadRequest(resp);
		//resp.setStatus(HttpServletResponse.SC_OK);
		CLI.debug(Loc.HTTP, "sessionKey: "+sK+"\n"+CLI.blue+" --- End Post --- "+CLI.reset+"\n");
	}

	@Override
	public void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {}

	public void failBadRequest(HttpServletResponse resp) {
		resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		CLI.debug(Loc.HTTP, CLI.red+" --- Bad request --- "+CLI.reset+"\n");
	}

	public void failNotAuthorised(HttpServletResponse resp) {
		resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		CLI.debug(Loc.HTTP, CLI.red+" --- Unauthorised request --- "+CLI.reset+"\n");
	}

	public void failServerError(HttpServletResponse resp) {
		resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		CLI.debug(Loc.HTTP, CLI.red+" --- Server error --- "+CLI.reset+"\n");
	}
}

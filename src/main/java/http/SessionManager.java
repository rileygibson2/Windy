package main.java.http;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.json.JSONException;
import org.json.JSONObject;

import main.java.accounts.AccountUtils;
import main.java.core.DataManager;
import main.java.core.Utils;
import main.java.debug.CLI;
import main.java.debug.CLI.Loc;

public class SessionManager {
	private final Map<Integer, AuthenticationSession> authSessions;
	private final Set<Session> sessions;
	
	public SessionManager() {
		sessions = new HashSet<Session>();
		authSessions = new HashMap<Integer, AuthenticationSession>();
	}
	
	public String createAuthenticationSession(String user) {
		JSONObject jObj = AccountUtils.getAccountObject(user);
		if (jObj==null) return null;

		int id = authSessions.size()+1;
		AuthenticationSession auth = null;

		try {auth = new AuthenticationSession(id, jObj.get("salt").toString(), (long) (DataManager.msInMinute*10));}
		catch (JSONException e) {CLI.debug(Loc.SESSION, "Error with creating authentication session - unit does not contain a salt"); return null;}

		authSessions.put(id, auth);
		CLI.debug(Loc.SESSION, "Created Auth Session: "+auth.formatInJSON());
		return auth.formatInJSON();
	}

	public AuthenticationSession getAuthSession(int id) {
		//Take chance to clean expired sessions
		Set<Integer> toRemove = new HashSet<>();
		for (Map.Entry<Integer, AuthenticationSession> m : authSessions.entrySet()) {
			if (m.getValue().isExpired()) toRemove.add(m.getKey());
		}
		for (Integer i : toRemove) authSessions.remove(i);

		//Get requested authentication session
		AuthenticationSession auth = authSessions.get(id);
		if (auth==null) return null;
		return auth;
	}

	public boolean authenticateSessionKey(String key) {
		boolean valid = false;
		Set<Session> toRemove = new HashSet<>(); //Take chance to clean expired keys
		for (Session sK : sessions) {
			if (sK.isExpired()) toRemove.add(sK);
			else if (sK.getKey().equals(key)) valid = true;
		}
		sessions.removeAll(toRemove);
		return valid;
	}

	public Session getSession(String key) {
		for (Session sK : sessions) {
			if (sK.getKey().equals(key)&&!sK.isExpired()) return sK;
		}
		return null;
	}

	/**
	 * Process:
	 * 	- client obtains auth session aS
	 * 	- client does p = h(aS.s2+h(aS.s1+password))
	 * 	- client sends p with aS.id
	 * 
	 * 	- server recieves and locates aS from the transmitted aS.id
	 * 	- server finds password in file (which is stored presalted with
	 * 	  s1).
	 * 	- server does p = h(aS.s2+storedPass)
	 * 	- server compares 2 p's.
	 * 
	 * @param key
	 * @return the generated session key, or "invalid"
	 */
	public String authenticateAccount(String user, String pass, int authID) {
		//Find relevant authentication session
		AuthenticationSession auth = getAuthSession(authID);
		if (auth==null) {CLI.debug(Loc.SESSION, "Invalid or expired authentication session."); return null;}

		//Read account file
		JSONObject jObj = AccountUtils.getAccountObject(user);
		if (jObj==null) return null;

		//Hash stored pass with authentication session salt
		String actualPass = Utils.hash(jObj.get("password").toString(), auth.getS2());
		CLI.debug(Loc.SESSION, "Actual Pass: "+actualPass+"\nGiven Pass: "+pass);
		authSessions.remove(authID); //Done with authentication session

		if (actualPass.equals(pass)) { //Valid password
			//Generate session key
			Session sK = new Session(user, (long) 2.16e+7);
			sessions.add(sK);
			CLI.debug(Loc.SESSION, "Valid authentication - issuing session key "+sK.getKey());

			//Get default unit from highest level account
			String defunit = AccountUtils.getDefaultUnit(user);

			//Send session key and default unit
			JSONObject toSend = new JSONObject();
			toSend.put("sK", sK.getKey()).put("defunit", defunit);
			return toSend.toString(1);
		}

		CLI.debug(Loc.SESSION, "Invalid.");
		return null;
	}
}

package main.java;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Scanner;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class AccountManager {

	private final Map<Integer, AuthenticationSession> authSessions;
	private final Set<Session> sessions;

	//Attributes present in different types of data files
	private static final String[] adminAccAttrs = {"id","alertNumbers","password","salt","PD","LF","RAL","AAL", "ENF","alertEmails","username","defunit","units","organisation","contactemail","children","access","parent"};
	private static final String[] childAccAttrs = {"id","access","parent","username","salt","password"};
	private static final String[] unitInfoAttrs = {"ip","id","name","status","power","version","direction"};

	public AccountManager() {
		sessions = new HashSet<Session>();
		authSessions = new HashMap<Integer, AuthenticationSession>();
	}

	public String createAuthenticationSession(String user) {
		JSONObject jObj = getAccountObject(user);
		if (jObj==null) return null;

		int id = authSessions.size()+1;
		AuthenticationSession auth = null;

		try {auth = new AuthenticationSession(id, jObj.get("salt").toString(), (long) (DataManager.msInMinute*10));}
		catch (JSONException e) {System.out.println("Error with creating authentication session - unit does not contain a salt"); return null;}

		authSessions.put(id, auth);
		System.out.println("Created Auth Session: "+auth.formatInJSON());
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
		if (auth==null) {System.out.println("Invalid or expired authentication session."); return null;}

		//Read account file
		JSONObject jObj = getAccountObject(user);
		if (jObj==null) return null;

		//Hash stored pass with authentication session salt
		String actualPass = Utils.hash(jObj.get("password").toString(), auth.getS2());
		System.out.println("Actual Pass: "+actualPass+"\nGiven Pass: "+pass);
		authSessions.remove(authID); //Done with authentication session

		if (actualPass.equals(pass)) { //Valid password
			//Generate session key
			Session sK = new Session(user, (long) 2.16e+7);
			sessions.add(sK);
			System.out.println("Valid authentication - issuing session key "+sK.getKey());

			//Get default unit from highest level account
			String defunit;
			jObj = getHighestLevelAccountInfo(user);
			try {defunit = jObj.get("defunit").toString();}
			catch (JSONException e) {
				System.out.println("No default unit assigned to account.");
				return null;
			}

			//Send session key and default unit
			JSONObject toSend = new JSONObject();
			toSend.put("sK", sK.getKey()).put("defunit", defunit);
			return toSend.toString(1);
		}

		System.out.println("Invalid.");
		return null;
	}

	public String getDefaultUnit(String user) {
		JSONObject jObj = getAccountObject(user);
		if (jObj==null) return null;
		return jObj.get("defunit").toString();
	}

	public String[] getAssignedUnits(String user) {
		JSONObject jObj = getHighestLevelAccountInfo(user);
		if (jObj==null) return null;
		return jObj.get("units").toString().split(" ");
	}

	public String[] getChildrenAccounts(String user) {
		JSONObject jObj = getAccountObject(user);
		if (jObj==null) return null;
		try {return jObj.get("children").toString().split(" ");}
		catch (JSONException e) {System.out.println("User "+user+" does not have children accounts"); return null;}
	}

	public JSONObject getAccountObject(String user) {
		//Read account file
		JSONObject jObj = null;
		try {
			Scanner s = new Scanner(new File("accounts/"+user+".acc"));
			jObj = new JSONObject(s.useDelimiter("\\A").next());
			s.close();
		}
		catch (FileNotFoundException e) {System.out.println("Invalid user - "+user); return null;}
		catch (JSONException e) {System.out.println("Empty or invalid account file contents - JSON error."); return null;}
		System.out.println("Requested user: "+user);
		return jObj;
	}

	public JSONObject getHighestLevelAccountInfo(String user) {
		//Look at account file
		JSONObject jObj = CoreServer.accountManager.getAccountObject(user);
		if (jObj==null) return null;

		//Get parent if has one
		if (!jObj.get("parent").toString().equals("null")) {
			System.out.println("Using parent: "+jObj.get("parent"));
			jObj = getAccountObject(jObj.get("parent").toString());
		}

		return jObj;
	}

	public boolean updateSettings(String user, String data) {
		JSONArray jArr = new JSONArray(data);

		for (int i=0; i<jArr.length(); i++) {
			JSONObject jObj = jArr.getJSONObject(i);

			//Copy and remove meta data
			String desc = jObj.getString("desc");
			String clienttag = null;
			try {clienttag = jObj.getString("clienttag");}
			catch (JSONException e) {} //Swallow as checked in a second
			jObj.remove("desc");
			jObj.remove("clienttag");
			System.out.println("\nObject Metadata: description="+desc+" clientag="+clienttag);

			//Object is an account
			if (desc.equals("account")) {
				String username = jObj.getString("username");
				JSONObject accObj = getAccountObject(username);
				if (accObj==null) return false;

				for (String k : adminAccAttrs) { //Go through all account attributes and fill in gaps in data object
					if (!jObj.has(k)) jObj.put(k, accObj.get(k)); //If not provided then pull from old
				}
				Utils.writeToFile("accounts/"+username+".acc", jObj.toString(1));
			}

			//Object is a child user
			if (desc.equals("childuser")) {
				if (clienttag==null) { //No special action, just update info
					String username = jObj.getString("username");
					JSONObject accObj = getAccountObject(username);
					if (accObj==null) return false;

					for (String k : childAccAttrs) { //Go through all account attributes and fill in gaps in data object
						if (!jObj.has(k)) jObj.put(k, accObj.get(k)); //If not provided then pull from old
					}
					Utils.writeToFile("accounts/"+username+".acc", jObj.toString(1));
				}
				else if (clienttag.equals("add")) { //New account
					System.out.println("Adding account: "+jObj.getString("username"));
					makeChildAccount(jObj);
				}
				else if (clienttag.equals("remove")) { //Remove account
					System.out.println("Removing account: "+jObj.getString("username"));
					removeAccount(jObj);
				}
			}

			//If object is a unit
			if (desc.equals("unit")) {
				String id = jObj.getString("id");
				JSONObject unitObj = CoreServer.unitManager.getUnitObject(id);
				if (unitObj==null) return false;

				if (clienttag==null) { //No special action, just update info
					for (String k : unitInfoAttrs) { //Go through all account attributes and fill in gaps in data object
						if (!jObj.has(k)) jObj.put(k, unitObj.get(k)); //If not provided then pull from old
					}
					Utils.writeToFile("units/"+id+"/unit.info", jObj.toString(1));
				}
				else if (clienttag.equals("remove")) {
					System.out.println("Removing unit: "+jObj.getString("id"));
					removeUnit(unitObj, user);
				}
			}
		}

		return true;
	}

	public void makeChildAccount(JSONObject accObj) {
		//Add extra fields and create file
		accObj.put("id", Utils.makeID());
		accObj.put("password", Utils.hash("w1", "12345678910"));
		accObj.put("salt", "12345678910");
		Utils.writeToFile("accounts/"+accObj.getString("username")+".acc", accObj.toString(1));

		//Add to linked children in parent file
		if (accObj.getString("parent")!="null") {
			JSONObject parent = getAccountObject(accObj.getString("parent"));
			String children = parent.getString("children");

			//Keep spacing correct so field can be split by whitespace
			if (children.length()==0) children += accObj.getString("username");
			else children += " "+accObj.getString("username");

			//Put data back in parent file
			parent.put("children", children);
			Utils.writeToFile("accounts/"+accObj.getString("parent")+".acc", parent.toString(1));
		}
	}

	public void removeAccount(JSONObject accObj) {
		String username = accObj.getString("username");

		//Delete account file
		new File("accounts/"+username+".acc").delete();

		//Remove from linked children in parent file
		if (accObj.getString("parent")!="null") {
			JSONObject parent = getAccountObject(accObj.getString("parent"));
			String[] children = parent.getString("children").split(" ");

			//Take this child out of array
			String childrenN = "";
			for (int i=0; i<children.length; i++) {
				if (children[i].equals(username)) continue;
				//Keep spacing correct so field can be split by whitespace
				if (childrenN.length()>0) childrenN += " "+children[i];
				else childrenN += children[i];
			}

			//Put data back in parent file
			parent.put("children", childrenN);
			Utils.writeToFile("accounts/"+accObj.getString("parent")+".acc", parent.toString(1));
		}
	}
	
	public void removeUnit(JSONObject unitObj, String user) {
		String id = unitObj.getString("id");

		//Delete unit files
		Utils.deleteFolder(new File("units/"+id), true);

		//Remove from linked units in account file
		if (user!=null) {
			JSONObject accObj = getAccountObject(user);
			String[] units = accObj.getString("units").split(" ");

			//Take this unit out of array
			String unitsN = "";
			for (int i=0; i<units.length; i++) {
				if (units[i].equals(id)) continue;
				//Keep spacing correct so field can be split by whitespace
				if (unitsN.length()>0) unitsN += " "+units[i];
				else unitsN += units[i];
			}

			//Put data back in account file
			accObj.put("units", unitsN);
			Utils.writeToFile("accounts/"+user+".acc", accObj.toString(1));
		}
	}
}

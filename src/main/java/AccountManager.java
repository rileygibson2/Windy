package main.java;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Scanner;
import java.util.Set;

import org.json.JSONException;
import org.json.JSONObject;

public class AccountManager {

	private final Map<Integer, AuthenticationSession> authSessions;
	private final Set<Session> sessions;

	private static final String[] infoAttrs = {"number","password","salt","PD","LF","RAL","AAL", "ENF","email","username","defunit","units"};

	public AccountManager() {
		sessions = new HashSet<Session>();
		authSessions = new HashMap<Integer, AuthenticationSession>();
	}

	public String createAuthenticationSession(String user) {
		JSONObject jObj = getAccountInfo(user);
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
		JSONObject jObj = getAccountInfo(user);
		if (jObj==null) return null;

		//Hash stored pass with authentication session salt
		String actualPass = hash(jObj.get("password").toString(), auth.getS2());
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

			//Send
			JSONObject toSend = new JSONObject();
			toSend.put("sK", sK.getKey()).put("defunit", defunit);
			return toSend.toString(1);
		}

		System.out.println("Invalid.");
		return null;
	}

	public boolean updateAccountInfo(String user, String jObjS) {
		JSONObject jObj = new JSONObject(jObjS);
		JSONObject oldObj = getAccountInfo(user); //Get old object

		//Go through all attributes and fill in gaps in data object
		for (String s : infoAttrs) {
			//If not provided then pull from old
			if (!jObj.has(s)) jObj.put(s, oldObj.get(s));
		}

		try { //Update account file
			FileWriter out = new FileWriter("accounts/"+user+".acc");
			out.write(jObj.toString(1));
			out.close();
			System.out.println("Successfully updated accounts.");
		} catch (IOException e) {System.out.println("IO Error."); return false;}	

		return true;
	}

	public String getDefaultUnit(String user) {
		JSONObject jObj = getAccountInfo(user);
		if (jObj==null) return null;
		return jObj.get("defunit").toString();
	}

	public String[] getAssignedUnits(String user) {
		JSONObject jObj = getHighestLevelAccountInfo(user);
		if (jObj==null) return null;
		return jObj.get("units").toString().split(" ");
	}

	public JSONObject getAccountInfo(String user) {
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
		JSONObject jObj = CoreServer.accountManager.getAccountInfo(user);
		if (jObj==null) return null;

		//Get parent if has one
		if (!jObj.get("parent").toString().equals("null")) {
			System.out.println("Using parent: "+jObj.get("parent"));
			jObj = getAccountInfo(jObj.get("parent").toString());
		}
		
		return jObj;
	}

	public static String hash(String toHash, String salt) {
		MessageDigest md = null;
		try {md = MessageDigest.getInstance("SHA-256");} 
		catch (NoSuchAlgorithmException e) {System.out.println("Hashing algorithim error: "+e.getStackTrace());}

		md.update(salt.getBytes(StandardCharsets.UTF_8)); // Change this to UTF-16 if needed
		md.update(toHash.getBytes(StandardCharsets.UTF_8)); // Change this to UTF-16 if needed
		byte[] digest = md.digest();
		String hex = String.format("%064x", new BigInteger(1, digest));
		return hex;
	}

	public String getSalt() {
		SecureRandom sr = new SecureRandom();
		String salt = "";
		for (int i=0; i<8; i++) salt += sr.nextInt(100);
		return salt;
	}
}

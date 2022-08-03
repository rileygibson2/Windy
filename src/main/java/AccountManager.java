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
	private final Set<SessionKey> sessionKeys;

	public AccountManager() {
		sessionKeys = new HashSet<SessionKey>();
		authSessions = new HashMap<Integer, AuthenticationSession>();
	}

	public String createAuthenticationSession(String unit) {
		JSONObject jObj = getAccountInfo(unit);
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
		Set<SessionKey> toRemove = new HashSet<>(); //Take chance to clean expired keys
		for (SessionKey sK : sessionKeys) {
			if (sK.isExpired()) toRemove.add(sK);
			else if (sK.getKey().equals(key)) valid = true;
		}
		sessionKeys.removeAll(toRemove);
		return valid;
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
	public String authenticateAccount(String unit, String pass, int authID) {
		//Find relevant authentication session
		AuthenticationSession auth = getAuthSession(authID);
		if (auth==null) {System.out.println("Invalid or expired authentication session."); return null;}

		//Read account file
		JSONObject jObj = getAccountInfo(unit);
		if (jObj==null) {System.out.println("Invalid unit name"); return null;}
		
		//Hash stored pass with authentication session salt
		String actualPass = hash(jObj.get("password").toString(), auth.getS2());
		System.out.println("Actual Pass: "+actualPass+"\nGiven Pass: "+pass);
		authSessions.remove(authID); //Done with authentication session
		
		if (actualPass.equals(pass)) { //Generate session key
			SessionKey sK = new SessionKey((long) 2.16e+7);
			sessionKeys.add(sK);
			System.out.println("Valid authentication - issuing session key "+sK.getKey());
			return sK.getKey();
		}
		
		System.out.println("Invalid.");
		return null;
	}

	public JSONObject getAccountInfo(String unit) {
		//Read account file
		JSONObject jObj = null;
		try {
			Scanner s = new Scanner(new File("accounts/"+unit+".info"));
			jObj = new JSONObject(s.useDelimiter("\\A").next());
			s.close();
		}
		catch (FileNotFoundException e) {System.out.println("Invalid unit name"); return null;}
		catch (JSONException e) {System.out.println("Empty or invalid unit file contents"); return null;}
		System.out.println("Requested Unit: "+unit);
		
		return jObj;
	}

	public boolean updateAccountInfo(String unit, String jObjS) {
		JSONObject jObj = new JSONObject(jObjS);
		try {
			//Check for unit file existence
			File f = new File("accounts/"+unit+".info");
			if (!f.exists()||f.isDirectory()) { 
				System.out.println("Unit file does not exist.");
				return false;
			}

			if (!jObj.has("password")) { //If provided data doesn't include a password change
				System.out.println("No new password, fetching from old file.");
				Scanner s = new Scanner(new File("accounts/"+unit+".info"));
				String oldObjS = s.useDelimiter("\\A").next();
				s.close();
				JSONObject oldObj = new JSONObject(oldObjS);
				jObj.put("password", oldObj.get("password"));
				jObj.put("salt", oldObj.get("salt"));
			}
			else { //If provided data does contain password change
				if (!jObj.has("salt")) return false;
				jObj.put("password", jObj.get("password").toString());
				jObj.put("salt", jObj.get("salt").toString());
				System.out.println("Password: "+jObj.get("password").toString()+"\nSalt: "+jObj.get("salt").toString());
			}

			//Update unit file
			FileWriter out = new FileWriter("accounts/"+unit+".info");
			out.write(jObj.toString(1));
			out.close();
			System.out.println("Successfully updated accounts.");
		} catch (IOException e) {System.out.println("IO Error."); return false;}	

		return true;
	}

	public String hash(String toHash, String salt) {
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

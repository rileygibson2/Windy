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
import java.util.HashSet;
import java.util.Scanner;
import java.util.Set;

import org.json.JSONObject;

public class AccountManager {

	private final Set<SessionKey> sessionKeys;
	
	public AccountManager() {
		sessionKeys = new HashSet<SessionKey>();
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
	
	public String authenticateAccount(String unit, String pass) {
		//Read account file
		String obj;
		try {
			Scanner s = new Scanner(new File("accounts/"+unit+".info"));
			obj = s.useDelimiter("\\A").next();
			s.close();
		}
		catch (FileNotFoundException e) {
			System.out.println("Invalid unit name"); return null;
		}
		
		JSONObject jObj = new JSONObject(obj);
		pass = hash(pass, jObj.get("salt").toString()); //Hash password
		System.out.println("Requested Unit: "+unit+"\n Stored Pass: "+jObj.get("password")+"\n Given Pass: "+pass);
		
		if (jObj.get("password").toString().equals(pass)) {
			SessionKey sK = new SessionKey((long) 2.16e+7);
			sessionKeys.add(sK);
			System.out.println("Valid authentication - issuing session key "+sK.getKey());
			return sK.getKey();
		}
		System.out.println("Invalid.");
		return null;
	}
	
	public String getAccountInfo(String unit) {
		String obj;
		try {
			Scanner s = new Scanner(new File("accounts/"+unit+".info"));
			obj = s.useDelimiter("\\A").next();
			s.close();
		}
		catch (FileNotFoundException e) {
			System.out.println("Invalid unit name"); return null;
		}
		System.out.println("Requested Unit: "+unit);
		JSONObject jObj = new JSONObject(obj);
		return jObj.toString(1);
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
			else { //Hash password
				String salt = getSalt();
				String hash = hash(jObj.get("password").toString(), salt);
				jObj.put("password", hash);
				jObj.put("salt", salt);
				System.out.println("Salt: "+salt+"\nHashed: "+hash);
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

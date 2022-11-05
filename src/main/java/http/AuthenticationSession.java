package main.java.http;

import java.security.SecureRandom;
import java.util.Date;

import org.json.JSONObject;

/**
 * Defines an open authentication session. In order to authenticate,
 * server needs to communicate a set of salts in order for client to
 * securely transmit password. So before an authentication takes place,
 * one of these sessions are created so that the server can reference back
 * to it's values.
 * 
 * @author thesmileyone
 *
 */
public class AuthenticationSession {
	private final int id;
	private final String s1; //First (predefined pepper like) salt
	private final String s2; //Second salt, randomly generated
	private final long expiry;
	
	public AuthenticationSession(int id, String s1, long life) {
		this.id = id;
		this.s1 = s1;
		String temp = "";
		SecureRandom r = new SecureRandom();
		for (int i=0; i<10; i++) temp += r.nextInt(50);
		s2 = temp;
		expiry = new Date().getTime()+life;
	}
	
	public boolean isExpired() {
		if (new Date().getTime()>=expiry) return true;
		return false;
	}
	
	public String getS1() {return this.s1;}
	
	public String getS2() {return this.s2;}
	
	public String formatInJSON() {
		JSONObject jObj = new JSONObject();
		jObj.put("id", id);
		jObj.put("s1", s1);
		jObj.put("s2", s2);
		return jObj.toString(1);
	}
	
}

package main.java;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Random;

import main.java.debug.CLI;
import main.java.debug.CLI.Loc;

public class Utils {

	//Characters for alphanumeric ids
	final static String candidates = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

	public static boolean writeToFile(String filePath, String content) {
		try {
			FileWriter out = new FileWriter(filePath);
			out.write(content);
			out.close();
			CLI.debug(Loc.UTIL, "Successfully written to file "+filePath);
			return true;
		} catch (IOException e) {CLI.debug(Loc.UTIL, "IO Error."); return false;}
	}

	public static String hash(String toHash, String salt) {
		MessageDigest md = null;
		try {md = MessageDigest.getInstance("SHA-256");} 
		catch (NoSuchAlgorithmException e) {CLI.debug(Loc.UTIL, "Hashing algorithim error: "+e.getStackTrace());}

		md.update(salt.getBytes(StandardCharsets.UTF_8)); // Change this to UTF-16 if needed
		md.update(toHash.getBytes(StandardCharsets.UTF_8)); // Change this to UTF-16 if needed
		byte[] digest = md.digest();
		String hex = String.format("%064x", new BigInteger(1, digest));
		return hex;
	}

	public String makeSalt() {
		SecureRandom sr = new SecureRandom();
		String salt = "";
		for (int i=0; i<8; i++) salt += sr.nextInt(100);
		return salt;
	}

	public static String makeID() {
		String id = "";
		for (int i=0; i<10; i++) {
			id += candidates.charAt(new Random().nextInt(candidates.length()));
		}
		return id;
	}

	public static void deleteFolder(File folder, boolean deleteThis) {
		File[] files = folder.listFiles();
		if (files!=null) {
			for (File f: files) {
				if (f.isDirectory()) deleteFolder(f, true);
				else f.delete();
			}
		}
		if (deleteThis) folder.delete();
	}
}

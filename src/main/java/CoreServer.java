package main.java;

import java.io.File;
import java.lang.reflect.Array;

import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.eclipse.jetty.servlet.ServletHandler;

public class CoreServer {
	public static AccountManager accountManager;
	public static UnitManager unitManager;

	public static void main(String[] args) throws Exception {
		Server server = new Server(80);
		String webappPath = System.getProperty("user.dir")+"/src/main/webapp";
		System.out.println(webappPath);
		accountManager = new AccountManager();
		unitManager = new UnitManager();

		ResourceHandler resourceHandler = new ResourceHandler();
		resourceHandler.setResourceBase(webappPath);
		//resourceHandler.setDirAllowed(true);
		//resourceHandler.setPathInfoOnly(false);
		ServletHandler dataHandler = new ServletHandler();
		server.setHandler(dataHandler);
		dataHandler.addServletWithMapping(WebServlet.class, "/data/*");

		HandlerList handlers = new HandlerList();
		handlers.setHandlers(new Handler[] { resourceHandler, dataHandler});
		server.setHandler(handlers);

		makeMockupData();

		server.start();
		System.out.println("Server running!");
		server.join();
	}

	public static void makeMockupData() {
		Utils.deleteFolder(new File("units"), false);
		Utils.deleteFolder(new File("accounts"), false);
		
		int count = 3;
		String id[] = new String[count];
		String ids = "";
		for (int i=0; i<count; i++) {
			id[i] = "windy"+Utils.makeID();
			if (i>0) ids += " ";
			ids += id[i];
		}
		
		DataMockup.makeAccount("mywindy", "admin", "null", id[0], ids);
		DataMockup.makeAccount("child", "employee", "mywindy", "", "");
		DataMockup.makeAccount("otherchild", "employee", "mywindy", "", "");
		DataMockup.makeRecords(0, id[0], "LAB Stage", "10", "-41.29158", "174.78594");
		DataMockup.makeRecords(0, id[1], "Rock Stage", "38", "-41.28952", "174.77992");
		DataMockup.makeRecords(0, id[2], "Frank Kitts", "100", "-41.28720", "174.77863");
		//DataMockup.makeRecords(0, id[3], "Pukeahu", "24");
		//DataMockup.makeAccountRecords();
	}
}

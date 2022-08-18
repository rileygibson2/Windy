package main.java;

import java.io.File;

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
		
		String def1 = "windy"+Utils.makeID();
		String def2 = "windy"+Utils.makeID();
		String def3 = "windy"+Utils.makeID();
		
		DataMockup.makeAccount("mywindy", "admin", "null", def1, def1+" "+def2+" "+def3);
		DataMockup.makeAccount("child", "employee", "mywindy", "", "");
		DataMockup.makeAccount("otherchild", "employee", "mywindy", "", "");
		DataMockup.makeRecords(0, def1, "LAB Stage", "8.8.8.8", "10");
		DataMockup.makeRecords(0, def2, "Rock Stage", "125.99.3.1", "38");
		DataMockup.makeRecords(0, def3, "Frank Kitts", "30.140.50.100", "100");
		//DataMockup.makeAccountRecords();
	}
}

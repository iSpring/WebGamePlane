package iSpring.WebSoceket;

import java.nio.channels.*;

public class GameInfo {
    public SocketChannel sc = null;
    public boolean running = true;
    public int width = 350;
    public int drawTime = 0;
    public GameInfo(SocketChannel _sc){
        sc = _sc;
    }
}

package iSpring.WebSoceket;

import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.channels.*;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.util.*;


public class WebSocketServer {
    int port = 8888;
    int BUFFER_SIZE = 1024;
    Selector selector = null;
    ServerSocketChannel serverChannel = null;
    List<GameInfo> listGameInfo = new ArrayList<GameInfo>();

    public WebSocketServer(int p){
        port = p > 1024 ? p : port;
        this.init();
        this.listen();
    }

    private void init(){
        try{
            this.selector = Selector.open();
            this.serverChannel = ServerSocketChannel.open();
            this.serverChannel.configureBlocking(false);
            InetAddress ia = InetAddress.getLocalHost();
            InetSocketAddress isa = new InetSocketAddress(ia,this.port);
            ServerSocket ss = this.serverChannel.socket();
            ss.bind(isa);
        }
        catch (Exception e){
            System.out.println("init发生异常:"+e.getMessage());
        }
    }

    public void listen(){
        try{
            SendMsgRunner r = new SendMsgRunner();
            Thread t = new Thread(r);
            t.start();
            this.serverChannel.register(this.selector,SelectionKey.OP_ACCEPT);
            while(this.selector.select() > 0){
                Set<SelectionKey> skSet = this.selector.selectedKeys();
                Iterator<SelectionKey> i = skSet.iterator();
                while(i.hasNext()){
                    SelectionKey sk = i.next();
                    this.process(sk);
                    i.remove();
                }
            }
        }
        catch(Exception e){
            System.out.println("listen发生异常");
        }
    }

    private void process(SelectionKey sk){
        SelectableChannel channel = sk.channel();
        try{
            if(sk.isValid()){
                //键合法
                if(sk.isAcceptable()){
                    ServerSocketChannel ssc = (ServerSocketChannel)sk.channel();
                    SocketChannel sc = ssc.accept();
                    sc.configureBlocking(false);
                    //最后一个参数是可选参数，是作为附件传递的Object类型，类似于C#中的实现
                    sc.register(this.selector,SelectionKey.OP_READ);
                }
                else if(sk.isReadable()){
                    SocketChannel sc = (SocketChannel)sk.channel();
                    Socket s = sc.socket();
                    ByteBuffer byteBuffer = ByteBuffer.allocate(this.BUFFER_SIZE);
                    int n = sc.read(byteBuffer);
                    if(n < 0){
                        return;
                    }
                    byteBuffer.flip();
                    String result = this.decode(byteBuffer);
                    Handshake hs = new Handshake(result);

                    boolean b = hs.isWebSocket();
                    if(b){
                        //浏览器发来握手信息
                        //打印出浏览器发过来的握手头信息
                        sc.register(this.selector,SelectionKey.OP_READ,hs);
                        System.out.println(s.getInetAddress()+":"+s.getPort()+"发来握手头消息:\r\n"+result);

                        //第一次给浏览器写回握手响应
                        String response = hs.getResponse();
                        ByteBuffer buffer = ByteBuffer.wrap(response.getBytes());
                        sc.write(buffer);
                    }
                    else{
                        //在建立连接之后浏览器给服务器发送信息，比如发送canvas的宽度信息
                        byte[] allBytes = byteBuffer.array();
                        byte[] bs = new byte[n];
                        for(int i=0;i<n;i++){
                            bs[i] = allBytes[i];
                        }
                        int opcode = DataFrame.getOpcode(bs);
                        if(opcode == 1){
                            //发来文本消息
                            byte[] realBytes = DataFrame.getInputBytes(bs);
                            String msg = new String(realBytes,"UTF-8");
                            System.out.println(s.getInetAddress()+":"+s.getPort()+"发来如下消息:\r\n"+msg);
                            if(msg.startsWith("width")){
                                //传入canvas的宽度信息
                                GameInfo gameInfo = new GameInfo(sc);
                                listGameInfo.add(gameInfo);
                                String[] ss = msg.split(":");
                                if(ss.length >= 2){
                                    int width = gameInfo.width;
                                    try{
                                        width = Integer.parseInt(ss[1]);
                                    }
                                    catch(Exception e){
                                        ;
                                    }
                                    gameInfo.width = width;
                                }
                                sk.attach(gameInfo);
                            }
                            else if(msg.startsWith("running")){
                                //传入是否正在运行的信息
                                String[] ss = msg.split(":");
                                if(ss.length >= 2){
                                    Object o = sk.attachment();
                                    if(o instanceof GameInfo){
                                        GameInfo gameInfo = (GameInfo)o;
                                        if(ss[1].equals("true")){
                                            gameInfo.running = true;
                                        }
                                        else if(ss[1].equals("false")){
                                            gameInfo.running = false;
                                        }
                                    }
                                }
                            }
                        }
                        else if(opcode == 8){
                            //连接关闭
                            //客户端突然关闭了页面
                            Iterator<GameInfo> i = listGameInfo.iterator();
                            while(i.hasNext()){
                                GameInfo gameInfo = i.next();
                                if(gameInfo.sc == sc){
                                    i.remove();
                                    System.out.println("关闭连接"+s.getInetAddress()+":"+s.getPort());
                                    break;
                                }
                            }
                            sk.cancel();
                        }
                    }
                }
            }
        }
        catch(Exception e){
            if(channel instanceof SocketChannel){
                SocketChannel sc = (SocketChannel)channel;
                Socket s = sc.socket();
                //客户端突然关闭了页面
                Iterator<GameInfo> i = listGameInfo.iterator();
                while(i.hasNext()){
                    GameInfo gameInfo = i.next();
                    if(gameInfo.sc == sc){
                        i.remove();
                        System.out.println("关闭连接"+s.getInetAddress()+":"+s.getPort());
                        break;
                    }
                }
            }
            //发生异常后要取消事件监听
            sk.cancel();
        }
    }

    //将读入字节缓冲的信息解码
    private String decode( ByteBuffer byteBuffer ) throws CharacterCodingException {
        Charset charset = Charset.forName("ISO-8859-1");
        CharsetDecoder decoder = charset.newDecoder();
        CharBuffer charBuffer = decoder.decode( byteBuffer );
        String result = charBuffer.toString();
        return result;
    }

    public void stop(){
        try{
            this.serverChannel.close();
            this.selector.close();
        }
        catch(Exception e){
            System.out.println("stop发生异常");
            e.printStackTrace();
        }
    }

    class SendMsgRunner implements Runnable{
        @Override
        public void run() {
            try{
                while(true){
                    Iterator<GameInfo> i = listGameInfo.iterator();
                    while(i.hasNext()){
                        GameInfo gameInfo = i.next();
                        SocketChannel sc = gameInfo.sc;
                        //服务器向浏览器发送信息
                        if(sc != null && gameInfo.running){
                            //String msg = new String("Message from Server");
                            String msg = getRandomInfo(gameInfo.width,gameInfo.drawTime);
                            byte[] bs = msg.getBytes();
                            byte[] bytesOutput = DataFrame.getOutputBytes(bs);
                            ByteBuffer buffer = ByteBuffer.wrap(bytesOutput);
                            sc.write(buffer);
                            gameInfo.drawTime++;
                        }
                    }
                    Thread.sleep(500);
                }
            }
            catch(Exception e){
                System.out.println("SendMsgRunner.run发生异常");
                e.printStackTrace();
            }
            finally{
                stop();
            }
        }

        //服务器给浏览器发送的随机信息，用户在客户端生成对象
        private String getRandomInfo(int canvasWidth,int drawTime){
            String info = "";
            int x=0;
            int y=0;
            String type = "SmallPlane";
            int spriteWidth = 32;
            int spriteHeight = 23;
            String speed = "";
            if((drawTime+1)%25==0){
                //发送道具奖品
                if((drawTime+1)%50==0){
                    //发送炸弹
                    type = "BombAward";
                    spriteWidth = 37;
                    spriteHeight = 48;
                }
                else{
                    //发送双子弹
                    type = "BulletAward";
                    spriteWidth = 37;
                    spriteHeight = 59;
                }
            }
            else{
                //发送敌机
                int[] nums = {0,0,0,0,0,1,0,0,1,0,0,0,0,1,1,1,1,1,1,2};
                int iType = (int)Math.floor(nums.length*Math.random());
                if(iType == 0){
                    type = "SmallPlane";//宽32
                    spriteWidth = 32;
                    spriteHeight = 23;
                }
                else if(iType == 1){
                    type = "MiddlePlane";//宽38
                    spriteWidth = 38;
                    spriteHeight = 49;
                }
                else if(iType == 2){
                    type = "BigPlane";//宽62
                    spriteWidth = 62;
                    spriteHeight = 90;
                }
                if(iType != 2){
                    if(Math.random()<0.33){
                        speed = ",\"speed\":4";
                    }
                }
            }

            x = (int)((canvasWidth - spriteWidth)*Math.random());
            y = -spriteHeight;
            String a = "\"type\":\""+type+"\",\"x\":"+x+",\"y\":"+y+speed;
            info = "{"+a+"}";

            return info;
        }
    }
}
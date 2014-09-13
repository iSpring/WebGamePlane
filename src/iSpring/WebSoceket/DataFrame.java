package iSpring.WebSoceket;

public class DataFrame {

    public static int getOpcode(byte[] bytesReceive){
        int opcode = -1;
        if(bytesReceive.length > 0){
            Byte fistByte = bytesReceive[0];
            String binaryStr = DataFrame.byteToBitString(fistByte); //Integer.toBinaryString(fistByte.intValue());
            char fin = binaryStr.charAt(0);
            if(fin == '1'){
                String opcodeStr = binaryStr.substring(4);
                opcode = Integer.valueOf(opcodeStr,2);
            }
        }
        return opcode;
    }

    //获取来自浏览器的实际有用的字节数组
    public static byte[] getInputBytes(byte[] bytesReceive){
        byte[] result = {};
        int opcode = getOpcode(bytesReceive);
        if(opcode == 1){
            //opcode为1表示接收到的是文本
            Byte secondByte = bytesReceive[1];
            String binaryStr2 = DataFrame.byteToBitString(secondByte);//Integer.toBinaryString(secondByte.intValue());
            char mask = binaryStr2.charAt(0);
            String lengthStr = binaryStr2.substring(1);
            int length = Integer.valueOf(lengthStr,2);
            if(length < 125){
                //如果length在0-125之间，那么length就表示数据字节数
                byte[] maskBytes = {bytesReceive[2],bytesReceive[3],bytesReceive[4],bytesReceive[5]};
                result = new byte[length];
                //bytesReceive索引号0开始，真正的客户端数据从6开始
                int count = 0;
                for(int i=6;i<bytesReceive.length;i++){
                    if(count < length){
                        //反异或回去
                        int A = maskBytes[count%4];
                        int C = bytesReceive[i];
                        int B = ~((~C)^A);
                        byte realByte = (byte)B;
                        result[count] = realByte;
                        count++;
                    }
                }
            }
        }
        return result;
    }

    //服务端给浏览器发送的信息不允许有掩码
    public static byte[] getOutputBytes(byte[] bytesOutput){
        byte[] result = {};
        byte fistByte = (byte)Integer.valueOf("10000001",2).intValue();

        if(bytesOutput.length <= 125){
            byte length = (byte)bytesOutput.length;
            String binaryStr = DataFrame.byteToBitString(length);
            String newBinaryStr = "0"+binaryStr.substring(1);
            byte secondByte = (byte)Integer.valueOf(newBinaryStr,2).intValue();
            result = new byte[2+length];
            result[0] = fistByte;
            result[1] = secondByte;
            for(int i=0;i<length;i++){
                result[2+i] = bytesOutput[i];
            }
        }
        return result;
    }


    //将字节转换为对应的字节
    public static String byteToBitString(byte b) {
        String result = ""
        + (byte) ((b >> 7) & 0x1) + (byte) ((b >> 6) & 0x1)
        + (byte) ((b >> 5) & 0x1) + (byte) ((b >> 4) & 0x1)
        + (byte) ((b >> 3) & 0x1) + (byte) ((b >> 2) & 0x1)
        + (byte) ((b >> 1) & 0x1) + (byte) ((b >> 0) & 0x1);
        return result;
    }
}

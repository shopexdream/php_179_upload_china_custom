<?php
/**
s
 */

class declarebaoguan{
    var $noCache = true;
    public function __construct(&$app)
    {
        $this->app= $app;
        $this->app_current = $app;
        $this->app_b2c = app::get('b2c');
        $this->tosign_dir_in=DATA_DIR.'/choucha179/in/';//待加签
        $this->signed_dir_out=DATA_DIR.'/choucha179/out/';//加签过的
        parent::__construct($this->app_b2c);
        header("Access-Control-Allow-Origin: *");
    }
    /*
     * 1.6.1.企业实时数据获取接口（部署在电商平台）
     * */
    private function getMillisecond() {
        list($t1, $t2) = explode(' ', microtime());
        return (float)sprintf('%.0f',(floatval($t1)+floatval($t2))*1000);
    }
    function  platDataOpen($orderNo,$sessionID,$serviceTime){
        file_put_contents(DATA_DIR.'/platDataOpen.txt',date('Y-m-d H:i:s')."\r\npost:".var_export($_POST,true)."\r\n"."phpinput:".var_export(file_get_contents('php://input'),true)."\r\n",FILE_APPEND);
        $openReq=json_decode($_POST['openReq'],true);
        $orderNo=$orderNo?$orderNo:$openReq['orderNo'];
        $sessionID=$openReq['sessionID'];
        $serviceTime=$serviceTime?$serviceTime:$openReq['serviceTime'];//发送过来的时候的时间
        $serviceTimeRec= $this->getMillisecond();//我echo给海关的时间
        $ret= '{"code":"10000","message":"","serviceTime":'.$serviceTimeRec.'}';
        echo $ret;
        $mdlLog=app::get('ecstoreappgzcepp')->model('apilog');
        $libgzcepp = kernel::single('ecstoreappgzcepp_gzcepp_api');
        /*写入日志*/
        $logData['url']='declare-platDataOpen.html';
        $logData['goods_id']=0;
        $logData['product_id']=0;
        $logData['order_id']=$libgzcepp->getOrderIdByPaymentId($orderNo);
        $logData['payment_id']=$orderNo;
        $logData['bn']='';
        $logData['type']='customs_realTimeDataUp';
        $logData['requestype']='post';
        $logData['data_from']='中国海关';
        $logData['data_to']='Ecstore';
        $logData['data_brief']='【'.$logData['data_to'].'】'.'接收海关抽查请求-写入带加签队列';
        $logData['data']=json_encode($_POST);
        $logData['response']=urldecode($ret);
        //print_r($logData);exit;
        $mdlLog->save($logData);
        /*开始上传待加签数据到队列*/
        if($orderNo) {
            $ret = $libgzcepp->realTimeDataUpSignOrg($orderNo, $sessionID, $serviceTime);
            file_put_contents(DATA_DIR.'/choucha179/in/'.date("YmdHis")."_".$orderNo.'_'.$serviceTime.'.txt',$ret);//写入待加签报文.
        }
        else{

        }
    }
    /*获取待加签任务列表，就是in目录里的txt文件。*/
    function  getChouchTastList(){
        if(!file_exists($this->tosign_dir_in.'.lock')) {
            //如果没有锁文件继续
            $files = $this->my_scandir($this->tosign_dir_in);
            foreach ($files as $k => $v) {
                $signorg = file_get_contents($this->tosign_dir_in.$v);//读取文件里的内容
                //把数据返回给前台客户端ajax，ajax success里获取res
                echo $v."$$$$$$$".$signorg;//通过$$$$$$$分割文件名和里面的内容
                file_put_contents($this->tosign_dir_in.'.lock', $v);//写锁.所里记录当前文件名
                exit;
            }
        }
        else{
            echo '.lock';//有锁，
        }
    }
    //ajax请求把signValue带过来
    function  uploadSignValue(){
        $file_name=$_POST['file_name'];//201912231010_191231232313_155546456465.txt
        $toSign=$_POST['toSign'];//原文
        $signValue=$_POST['signValue'];//签名
        $file_name_rs=explode('_',$file_name);
        $orderNo=$file_name_rs[1];//201912231010_191231232313_155546456465
        $mdlLog=app::get('ecstoreappgzcepp')->model('apilog');
        $libgzcepp = kernel::single('ecstoreappgzcepp_gzcepp_api');
        /*写入日志*/
        $logData['url']='declare-uploadSignValue.html';
        $logData['goods_id']=0;
        $logData['product_id']=0;
        $logData['order_id']=$libgzcepp->getOrderIdByPaymentId($orderNo);
        $logData['payment_id']=$orderNo;
        $logData['bn']='';
        $logData['type']='customs_realTimeDataUp';
        $logData['requestype']='post';
        $logData['data_from']='Ecstore';
        $logData['data_to']='中国海关';
        $logData['data_brief']='【'.$logData['data_to'].'】'.'接收海关抽查请求-加签成后上传给web服务器';
        $logData['data']=json_encode($_POST);
        $logData['response']='成功上传到web服务器';
        $mdlLog->save($logData);
        if($orderNo) {
           // print_r($toSign);exit;
            $retSignValue = $libgzcepp->realTimeDataUpSignValue($orderNo, $logData['order_id'],$toSign,$signValue);
            //
            $newFile=$this->signed_dir_out.$file_name;
            $oldFile=$this->tosign_dir_in.$file_name;
            $lockFile=$this->tosign_dir_in.'.lock';//锁文件
            copy($oldFile,$newFile); //拷贝到新目录
            chmod($newFile, 0777);
            file_put_contents($newFile,"signOrg:\r\n".file_get_contents($oldFile)."\r\nsignValue:\r\n".$signValue);//新文件的内容为 待加签+签名
            unlink($oldFile); //删除旧目录下的文件
            unlink($lockFile);//删除锁文件
        }
        else{

        }

        echo json_encode($retSignValue);
    }
    /**
     * 将读取到的目录以数组的形式展现出来
     * @return array
     * opendir() 函数打开一个目录句柄，可由 closedir()，readdir() 和 rewinddir() 使用。
     * is_dir() 函数检查指定的文件是否是目录。
     * readdir() 函数返回由 opendir() 打开的目录句柄中的条目。
     * @param array $files 所有的文件条目的存放数组
     * @param string $file 返回的文件条目
     * @param string $dir 文件的路径
     * @param resource $handle 打开的文件目录句柄
     */
    function my_scandir($dir)
    {
        //定义一个数组
        $files = array();
        //检测是否存在文件
        if (is_dir($dir)) {
            //打开目录
            if ($handle = opendir($dir)) {
                //返回当前文件的条目
                while (($file = readdir($handle)) !== false) {
                    //去除特殊目录
                    if ($file != "." && $file != "..") {
                        //判断子目录是否还存在子目录
                        if (is_dir($dir . "/" . $file)) {
                            //递归调用本函数，再次获取目录
                            $files[$file] = my_scandir($dir . "/" . $file);
                        } else {
                            //获取目录数组
                            $files[] =  $file;
                        }
                    }
                }
                //关闭文件夹
                closedir($handle);
                //返回文件夹数组
                return $files;
            }
        }
    }

}
?>
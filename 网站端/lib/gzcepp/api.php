<?php
/**
广州跨境公服平台bysk
qq:1171353006
 */
class ecstoreappgzcepp_gzcepp_api
{
    /**
     * 构造方法
     * @param object app
     * @return null
     */
    public function __construct($app){
        $this->app = $app;
        $this->libset=kernel::single("ecstoreappgzcepp_apisetting");
        $this->coCode=$this->libset->getKuaJingSetting('corp','coCode');
        $this->md5key=$this->libset->getKuaJingSetting('corp','md5key');
        $this->ebpCode=$this->libset->getKuaJingSetting('corp','ebcCode');//电商平台代码
        $this->ebpName=$this->libset->getKuaJingSetting('corp','ebcName');//电商平台名称
        $this->ebcCode=$this->libset->getKuaJingSetting('corp','ebcCode');//电商企业代码
        $this->ebcName=$this->libset->getKuaJingSetting('corp','ebcName');//电商企业名称
        $this->tradeCode=$this->libset->getKuaJingSetting('corp','tradeCode');//3100100697
        $this->Token=$this->libset->getKuaJingSetting('corp','token');//3100100697
    }
    
   
    public function docurl($url,$post_data,&$curl_error){
        //初始化
        $curl = curl_init();
        //设置抓取的url
        curl_setopt($curl, CURLOPT_URL,$url);
        //设置头文件的信息作为数据流输出
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_TIMEOUT, 10);

        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        //设置获取的信息以文件流的形式返回，而不是直接输出。
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        //设置post方式提交
        curl_setopt($curl, CURLOPT_POST, 1);
        //设置post数据

        curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($post_data));
        //执行命令
        $data = curl_exec($curl);
            if($data===false){
                    $curl_error= 'Curl error: ' . curl_error($curl);
            }
        //关闭URL请求
        curl_close($curl);
        //显示获得的数据
        return $data;
    }

   
    function  getPaymentTradeNo($order_id){
        $this->db=kernel::database();
        $bills=$this->db->select('select bill_id from sdb_ectools_order_bills where rel_id='.$order_id.' and bill_type="payments"');//因为返回的是转化后的货币，所以得查询我方的实际金额2015-02-04 13:50:55-sk
        $old_payment_id='';
        $old_trado_no='';
        foreach($bills as $k=>$v){
            $tmp=$this->db->selectRow('select status,trade_no,bankSerialNumber from sdb_ectools_payments where payment_id='.$this->db->quote($v['bill_id']));
            if($tmp['status']=='succ'){
                $old_payment_id=$v['bill_id'];
                $old_trade_no=$tmp['bankSerialNumber'];//?$tmp['bankSerialNumber']:$tmp['trade_no'];//2019年01月15日16:54:14 有银行流水号用银行的
                break;
            }
        }
        return $old_trade_no;
    }

    /*
 *根据支付单号返回支付单的信息
 */
    function  getPaymentInfoByPaymentId($payment_id){
        $this->db=kernel::database();
        $tmp=$this->db->selectRow('select * from sdb_ectools_payments where payment_id='.$this->db->quote($payment_id));
        $bill=$this->db->selectRow('select rel_id from sdb_ectools_order_bills where bill_id='.$this->db->quote($payment_id).' and bill_type="payments"');
        $tmp['order_id']=$bill['rel_id'];
        return $tmp;
    }
    /*
     *根据订单号返回成功的支付单的信息
     */
    function  getPaymentInfoByOrderId($order_id){
        $this->db=kernel::database();
        $bills=$this->db->select('select bill_id from sdb_ectools_order_bills where rel_id='.$order_id.' and bill_type="payments"');//因为返回的是转化后的货币，所以得查询我方的实际金额2015-02-04 13:50:55-sk
        $old_payment_id='';
        $old_trado_no='';
        foreach($bills as $k=>$v){
            $tmp=$this->db->selectRow('select * from sdb_ectools_payments where payment_id='.$this->db->quote($v['bill_id']));
            if($tmp['status']=='succ'){
                return $tmp;
                break;
            }
        }
    }

    /*根据订单号返回支付单里的payment_id*/
    function  getPaymentId($order_id){
        $this->db=kernel::database();
        $bills=$this->db->select('select bill_id from sdb_ectools_order_bills where rel_id='.$order_id.' and bill_type="payments"');//因为返回的是转化后的货币，所以得查询我方的实际金额2015-02-04 13:50:55-sk
        $old_payment_id='';
        $old_trado_no='';
        foreach($bills as $k=>$v){
            $tmp=$this->db->selectRow('select status,trade_no from sdb_ectools_payments where payment_id='.$this->db->quote($v['bill_id']));
            if($tmp['status']=='succ'){
                $old_payment_id=$v['bill_id'];
                $old_trade_no=$tmp['trade_no'];
                break;
            }
        }
        return $old_payment_id;
    }
    /*根据支付单号返回订单号*/
    function  getOrderIdByPaymentId($payment_id){
        $this->db=kernel::database();
        $bill=$this->db->selectRow('select rel_id from sdb_ectools_order_bills where bill_id='.$this->db->quote($payment_id).' and bill_type="payments"');
        return $bill['rel_id'];
    }
    function guid(){
        if (function_exists('com_create_guid')){
            return com_create_guid();
        }else{
            mt_srand((double)microtime()*10000);//optional for php 4.2.0 and up.
            $charid = strtoupper(md5(uniqid(rand(), true)));
            $hyphen = chr(45);// "-"
            $uuid = //chr(123)// "{"
                substr($charid, 0, 8).$hyphen
                .substr($charid, 8, 4).$hyphen
                .substr($charid,12, 4).$hyphen
                .substr($charid,16, 4).$hyphen
                .substr($charid,20,12);
            //.chr(125);// "}"
            return $uuid;
        }
    }
    /**/
    function  getToSignTxt($payment_id,$sessionID,$serviceTime){
        /*协议参数*/
        $payExInfoStr['sessionID']=$sessionID;
        $payExchangeInfoHead['guid']=$this->guid();
        $payInfo=$this->getPaymentInfoByPaymentId($payment_id);
        $payExchangeInfoHead['initalRequest']=$payInfo['initalRequest']?$payInfo['initalRequest']:('https://api.mch.weixin.qq.com/pay/unifiedorder?out_trade_no='.$payment_id.'&total_fee='.($payInfo['cur_money']*100));//
        $payExchangeInfoHead['initalResponse']=$payInfo['initalResponse']?$payInfo['initalResponse']:'ok';
       
        $payExchangeInfoHead['ebpCode']= $this->ebcCode;
        $payExchangeInfoHead['payCode']=trim($this->libset->getKuaJingSetting('pay','payMerchantCode'));//
        $order_id=$payInfo['order_id'];
        $payExchangeInfoHead['payTransactionId']=$payInfo['trade_no']?$payInfo['trade_no']:'trade_no';//"110796T001" ;//
        $payExchangeInfoHead['totalAmount']=floatval($payInfo['cur_money']);//"110796T001" ;//
        $payExchangeInfoHead['currency']=$this->libset->getKuaJingSetting('pay','payCUR');//152
        $payExchangeInfoHead['verDept']=$payInfo['verDept']?$payInfo['verDept']:'3';//"110796T001" ;//
        $payExchangeInfoHead['payType']=$payInfo['payType']?$payInfo['payType']:'4';//"110796T001" ;//
        $payExchangeInfoHead['tradingTime']=date('YmdHis',$payInfo['t_payed']);              $payExchangeInfoHead['note']=$order_id;
        $payExInfoStr['payExchangeInfoHead']=$payExchangeInfoHead;
        /*
         * 商品明细
         */
        $cargo=array();
        $b2corder = app::get('b2c')->model('orders');
        $subsdf = array('order_objects'=>array('*',array('order_items'=>array('*',array(':products'=>'*')))));
        $orderinfo = $b2corder->dump($order_id, '*', $subsdf);
        $items=$orderinfo['order_objects'];
        $i=0;
        foreach($items as $ktop=>$vtop){
            // $cargoes=array();
            foreach($vtop['order_items'] as $k=>$v) {
                $i++;
                $cargo['gname'] =$v['name'];
                $cargo['itemLink'] =app::get('wap')->router()->gen_url(array('app'=>'b2c','ctl'=>'wap_product','act'=>'index','arg0'=>$vtop['goods_id'],'full'=>1));
                $cargoes[] = $cargo;
            }
           
        }
        $tmpInfoList['orderNo']=$payment_id;
        $tmpInfoList['goodsInfo']=$cargoes;
        $tmpInfoList['recpAccount']=trim($this->libset->getKuaJingSetting('psp','custom_payweixinMerNo'));
        $tmpInfoList['recpCode']=trim($this->libset->getKuaJingSetting('corp','licenseId'));
        $tmpInfoList['recpName']=$this->ebpName;
        $payExchangeInfoLists[]=$tmpInfoList;
        $payExInfoStr['payExchangeInfoLists']=$payExchangeInfoLists;
        /*协议参数end*/;

        /*开始拼接海关要的原文*/
        $full='';
        $full='"sessionID":"'.$payExInfoStr['sessionID'].'"||';
        $full.=('"payExchangeInfoHead":"'.json_encode($payExInfoStr['payExchangeInfoHead'],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE).'"||');
        $full.=('"payExchangeInfoLists":"'.json_encode($payExInfoStr['payExchangeInfoLists'],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE).'"||');
        $full.='"serviceTime":"'.$serviceTime.'"';
        return $full;
    }
    
    /*组织 待加签 报文格式*/
    function  realTimeDataUpSignOrg($payment_id,$sessionID,$serviceTime){
        $resFromgzcepp=$this->getToSignTxt($payment_id,$sessionID,$serviceTime);//生成加密字符串
        return $resFromgzcepp;
        /*写入日志end*/
    }
    /*真正的上传加签报文给海关*/
    function  realTimeDataUpSignValue($payment_id,$order_id,$toSign,$signValue){
        $posturl=$this->libset->getKuaJingSetting('corp','api_custom_realTimeDataUp');
        $certNo=$this->libset->getKuaJingSetting('psp','custom_usbKeyCertNo');
        $toSignRs=explode('||',$toSign);
        $toSignRs[1]=rtrim( $toSignRs[1],'"');
        $toSignRs[1]=str_replace('"payExchangeInfoHead":"','"payExchangeInfoHead":',$toSignRs[1]);//
        $toSignRs[2]=rtrim( $toSignRs[2],'"');
        $toSignRs[2]=str_replace('"payExchangeInfoLists":"','"payExchangeInfoLists":',$toSignRs[2]);//
        $signValue=json_decode($signValue,true);
        $signValue=$signValue['Data'][0];
        $json='{'.implode(',',$toSignRs).',"certNo":"'.$certNo.'","signValue":"'.$signValue.'"}';
        $last['payExInfoStr']=$json;
        /*写入日志end*/
        $ret=$this->docurl($posturl,$last,$msg);
        $mdlLog=$this->app->model('apilog');
        /*写入日志*/
        $logData['url']=$posturl;
        $logData['goods_id']=0;
        $logData['product_id']=0;
        $logData['order_id']=$order_id;
        $logData['payment_id']=$payment_id;
        $logData['bn']='';
        $logData['type']='customs_realTimeDataUp';
        $logData['requestype']='post';
        $logData['data_from']='Ecstore';
        $logData['data_to']='中国海关';
        $logData['data_brief']='【'.$logData['data_to'].'】'.'向海关传递实时数据';
        $logData['data']=$json;//json_encode($last,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
        $logData['response']=strip_tags(urldecode($ret));
        $mdlLog->save($logData);
        return $ret;
        /*写入日志end*/
    }

}
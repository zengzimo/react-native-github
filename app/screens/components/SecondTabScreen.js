/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  FlatList
} from 'react-native';

import HttpUtils from '../../Vendor/HttpUtils'
import DataRepository,{FLAG_STORAGE} from '../../dao/DataRepository'
import LanguageDao,{FLAG_LANGUAGE} from '../../dao/LanguageDao'
import TrendingCell from '../view/TrendingCell'
import TimeSpan from '../../model/TimeSpan'
import CustomTopBar from '../view/CustomTopBar'
import BasicExample from '../view/BasicExample'

import {Navigation} from 'react-native-navigation';
import ScrollableTabView,{ScrollableTabBar} from 'react-native-scrollable-tab-view'

Navigation.registerComponent('com.fof.CustomTopBar', () => CustomTopBar);

var timeSpanTextArray = [new TimeSpan('今天','since=daily'),new TimeSpan('本周','since=weekly'),new TimeSpan('本月','since=nmonlly')];
const API_URL = 'https://github.com/trending/';


export default class SecondTabScreen extends Component<{}> {
  constructor(props){
    super(props);
    this.languageDao = new LanguageDao(FLAG_LANGUAGE.flag_language);
    this.state={
      languages:[],
      popover:false
    }
  }
  componentDidMount(){
      this.props.navigator.setStyle({
      navBarCustomView: 'com.fof.CustomTopBar',
      navBarComponentAlignment: 'center',
      navBarCustomViewInitialProps: {title: 'Hi Custom',aa:()=>{
        console.log('点击了----');
        this.setState({popover:true})
      }}
    });
    this._loadData();
  }
  _loadData(){
    this.languageDao.fetch()
    .then(result=>{
      if (result) {
          this.setState({
              languages: result,
          });
      }
    })
    .catch(error=>{
      console.log(error);
    })
  }
  render() {
    let content = this.state.languages.length>0?
    <ScrollableTabView
        tabBarBackgroundColor='#2196F3'
        tabBarInactiveTextColor='mintcream'
        tabBarActiveTextColor='white'
        tabBarUnderlineStyle={{backgroundColor:'#e7e7e7',height:2}}
        renderTabBar={() => <ScrollableTabBar style={{height: 40, borderWidth: 0, elevation: 2}}
                                              tabStyle={{height: 39}}/>}
    >
    {this.state.languages.map((reuslt, i, arr)=> {
        let language = arr[i];
        return language.checked ? <TrendingTab key={i} tabLabel={language.name} {...this.props}/> : null;
    })}
    </ScrollableTabView>:null;
    return (
      <View style={styles.container}>
        {content}
      </View>
    );
  }
}

class TrendingTab extends Component{
  constructor(props){
    super(props);
    this.dataRepository = new DataRepository(FLAG_STORAGE.flag_trending);
    this.state={
      result:'',
      refresh:true
    }
  }
  componentDidMount(){
    this.onLoad();
  }
  onLoad(){
    let url = this.genURL('?since=daily',this.props.tabLabel);
    this.dataRepository.fetchRepository(url)
        .then(result=>{
          console.log('result-----'+result);
          let items = result&&result.items?result.items:result?result:[];
          this.setState({
            data:items,
            refresh:false
          });
          if (result&&result.update_date&&!this.dataRepository.checkData(result.update_date)) {
            return this.dataRepository.fetchNewRepository(url);
          }
        })
        .then((items)=>{
          if(!items||items.length==0)return;
          this.setState({
            data:items,
            refresh:false
          });
        })
        .catch(error=>{
          this.setState({
            data:[],
            refresh:false
          });
          console.log(error);
        });
  }
  genURL(timeSpan,category){
    return API_URL+category+'?'+timeSpan.searchText;
  }

  _renderItem = ({item}) => (
      <TrendingCell
       aa = {item}
       onSelect={()=>{
         this.props.navigator.push({
           screen: 'com.fof.RepositoryDetail',
           title: item.fullName,
           passProps:{
             item:item
           },
           navigatorStyle:{//此方式与苹果原生的hideWhenPushed一致
               tabBarHidden: true
           }
         });
       }}
       />
    );

  _keyExtractor = (item, index) => index;

  _onRefresh = () => {
      this.setState({
          refresh:true
      });
      this.onLoad();
  }
  render(){
    return(
      <View style={{flex:1}}>
        <FlatList
          data={this.state.data}
          keyExtractor={this._keyExtractor}
          renderItem={this._renderItem}
          refreshing={this.state.refresh}
          onRefresh={this._onRefresh}
        />
       {/**<Text style={{height:600}}>{this.state.data}</Text>*/}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

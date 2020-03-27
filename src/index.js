import axios from "axios";
function Graph(root_path = '/path-graph') {
  this.endpoint = root_path;
  this.page = 1;
  this.auto_link = false;
  this.axiosConfig = {}
  this.queryTree = {
    service_name: null,
    service_method: 'getAll',
    columns: [],
    alias: null,
    id: null,
    params: {},
    queries: {},
    filters: {},
    post_params: {},

  };

  this.AutoLink = function () {
    this.auto_link = true;
    return this;
  }

  this.Service = function (service) {
    this.queryTree.service_name = service;
    return this;
  }

  this.Where = function(conditions){
    this.queryTree.filters = {
      ...this.queryTree.filters,
      ...conditions
    }
    return this;
  }

  this.Ref = function(id){
    this.queryTree.filters = {
      ...this.queryTree.filters,
      ...{id}
    }
    return this;
  }

  Graph.Column = function (column) {
    if (/[^\w_]/.test(column)) {
      throw new Error('Invalid column name');
    }
    return {
      name: column,
      type: 'column',
      tree: null
    }
  };

  Graph.Col = function (column) {
    return Graph.Column(column)
  };
  this.fetchOne = function (...columns) {
    this.queryTree.service_method = "getOne";
    columns = columns.map(column => typeof column == 'string' ? Graph.Column(column):column);
    this.queryTree.columns = [
      ...this.queryTree.columns,
      ...columns
    ];
    return this;
  }
  this.fetchAll = function (...columns) {
    this.queryTree.service_method = "getAll";
    columns = columns.map(column => typeof column == 'string' ? Graph.Column(column):column);
    this.queryTree.columns = [
      ...this.queryTree.columns,
      ...columns
    ];
    return this;
  }
  this.Func = function (func) {

    if(!func)
      throw new Error("Specify fetch method");

    this.queryTree.service_method = func;
    return this;
  };

  this.Fetch = function (...columns) {
    this.queryTree.columns = [
      ...this.queryTree.columns,
      ...columns
    ];
    return this;
  }
  this.As = function (alias) {
    this.queryTree.alias = alias;
    return {
      name: alias,
      type: 'instance',
      method: this.queryTree.service_method,
      service: this.queryTree.service_name,
      columns:this.queryTree.columns,
      params:this.queryTree.params,
      queries:this.queryTree.queries,
      filters:this.queryTree.filters,
      post_params:this.queryTree.post_params,
      tree: this.queryTree
    }
  }



  let paramsToStr = function (params) {
    return JSON.stringify(params)
  }

  // /query?fetch=BlogPosts/getAll[title,description,author:Authors/getOne[name]]&id=1

  /**
   * @return {string}
   */
  let ColumnToStr = function (root,columns) {
    let str = "";
    if(columns.length){
      for (let index in columns){
        let column = columns[index];
        //  generate params
        if(column.type === "column"){
          str += '&'+root+`[${column.name}][type]=column`
        }else if(column.type === "instance"){
          str += `&${root}[${column.name}][type]=service`;
          str += `&${root}[${column.name}][func]=${column.method}`;
          str += `&${root}[${column.name}][service]=${column.service}`;
          str += `&${root}[${column.name}][filters]=${paramsToStr(column.filters)}`;
          str += `&${root}[${column.name}][params]=${paramsToStr(column.params)}`;
          str += ColumnToStr(`${root}[${column.name}][columns]`,column.columns)
        }
        //${treeToStr(column.tree)}
      }
    }

    return str;
  };

  let treeToStr = function (queryTree, root = null) {
    let query = "";
    let _root = "";
    query += `${queryTree.service_name}[func]=${queryTree.service_method}`;
    query += `&${queryTree.service_name}[service]=${queryTree.service_name}`;
    query += `&${queryTree.service_name}[type]=service`;
    query += `&${queryTree.service_name}[params]=${paramsToStr(queryTree.params)}`;
    query += `&${queryTree.service_name}[filters]=${paramsToStr(queryTree.filters)}`;
    _root = `${queryTree.service_name}[columns]`;
    query += ColumnToStr(_root,queryTree.columns);

    return query;
  };

  this.toLink = function () {
    // console.log(JSON.stringify(this.queryTree))
    if(!this.queryTree.service_name)
      throw new Error("Service not specified");

    return treeToStr(this.queryTree,null);
  };

  this.setAxiosConfig = function(config){
    this.axiosConfig = config;
  };

  this.axios = axios.create(this.axiosConfig);

  this.get = async function (page = 1) {
    this.page = page;
    return this.axios.post(this.endpoint,{
      _____graph: this.toLink(),
      _____method: "GET",
      ...(this.auto_link && {_____auto_link: "yes"})
    })
  };

  this.set = async function (values = {}) {
    this.queryTree.post_params = {
      ...this.queryTree.post_params,
      ...values
    };
    return this.axios.post(this.endpoint,{
      _____graph: this.toLink(),
      _____method: "POST",
      ...this.queryTree.post_params,
      ...(this.auto_link && {_____auto_link: "yes"})
    })
  };


  this.SetParams = function (params) {
    this.queryTree.params = {
      ...this.queryTree.params,
      ...params
    };
    return this;
  };

}

export default Graph;
export {Graph}

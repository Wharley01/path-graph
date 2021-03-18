import axios from "axios";
import {md5} from "pure-md5"
export class Response {
  constructor(
    res = {
      data: null,
      msg: "",
      status: 0,
    }
  ) {
    this.raw_response = res;
  }
  getData() {
    if (typeof this.raw_response["data"] !== "undefined") {
      return this.raw_response.data;
    } else {
      return null;
    }
  }

  setData(data) {
    this.raw_response.data = data;
  }

  getMsg() {
    if (typeof this.raw_response.msg !== "undefined") {
      return this.raw_response.msg;
    } else {
      return null;
    }
  }

  getNetworkErrorMsg() {
    if (typeof this.raw_response["network_msg"] !== "undefined") {
      return this.raw_response.network_msg;
    } else {
      return null;
    }
  }

  getStatus() {
    if (typeof this.raw_response.status !== "undefined") {
      return this.raw_response.status;
    } else {
      return 0;
    }
  }

  getTotalPages() {
    if (typeof this.raw_response.total_pages !== "undefined") {
      return this.raw_response.total_pages;
    } else {
      return 1;
    }
  }

  getCurrentPage() {
    if (typeof this.raw_response.current_page !== "undefined") {
      return this.raw_response.current_page;
    } else {
      return 1;
    }
  }
}

function FormBuild(fields) {
  let isArray = function(a) {
    return (!!a) && (a.constructor === Array);
  };

  let isObject = function(a) {
    return (!!a) && (a.constructor === Object);
  };
  let form = new FormData();
  for (let field in fields) {
    if (typeof fields[field] !== 'undefined') {
      let value = fields[field];
      if (value === null)
        continue;
      value = value === false ? 0 : (value === true) ? 1 : value;
      if (isArray(value)  ||  isObject(value)){
        value = JSON.stringify(value);
      }
      form.append(field, value);
    }
  }
  return form;
}
Graph.requestConfig = {};

Graph.setRequestConfig = function (config) {
  Graph.requestConfig = {
    ...Graph.requestConfig,
    ...config,
  };
};

Graph.Column = function (column) {
  if (/[^\w_]/.test(column)) {
    throw new Error("Invalid column name");
  }
  return {
    name: column,
    type: "column",
    tree: null,
  };
};

Graph.validColOnly = function (column) {
  if (!/[\w._]+/.test(column)) {
    throw new Error("Invalid column name");
  }

  return column;
}

Graph.Col = function (column) {
  return Graph.Column(column);
};

export default function Graph() {
  if (!Graph.endpoint) {
    Graph.endpoint = "/path-graph";
  }

  this.auto_link = false;
  this.queryTree = {
    service_name: null,
    service_method: null,
    columns: [],
    alias: null,
    id: null,
    page: 1,
    params: {},
    query: null,
    filters: {},
    post_params: {},
  };
  this.last_col = null;
  this.accumulate = false;

  this.autoLink = function () {
    this.auto_link = true;
    return this;
  };

  this.service = function (service) {
    service = service.split("/");

    this.queryTree.service_name = service[0];
    if (typeof service[1] !== "undefined") {
      this.func(service[1]);
    }
    return this;
  };

  this.where = function (conditions) {
    if(typeof conditions == 'object')
      this.queryTree.filters = conditions;
    else
      this.last_col = conditions
    return this;
  };

  this.andWhere = function (conditions) {
    if(typeof conditions == 'object')
      this.queryTree.filters = conditions;
    else
      this.last_col = conditions
    this.accumulate = true;
    return this;
  };

  this.greaterThan = function (value) {
    return this.addCustomFilter(value,">")
  }
  this.lessThan = function (value) {
    return this.addCustomFilter(value,"<")
  }
  this.equals = function (value) {
    return this.addCustomFilter(value,"==")
  }
  this.notEquals = function (value) {
    return this.addCustomFilter(value,"!=")
  }
  this.isNull = function (value) {
    return this.addCustomFilter(value,"NULL")
  }
  this.isNotNull = function (value) {
    return this.addCustomFilter(value,"NOTNULL")
  }
  this.matches = function (value) {
    return this.addCustomFilter(value,"MATCHES")
  }
  this.isLike = function (value) {
    return this.addCustomFilter(value,"LIKES")
  }
  this.isNotLike = function (value) {
    return this.addCustomFilter(value,"NOT-LIKES")
  }

  this.addCustomFilter = function (value,operator) {
    if(!this.last_col)
      throw new Error(`Specify column to compare ${value} with`);
    let filter = {
      [this.last_col]:{
        value,
        operator
      }
    }
    this.queryTree.filters = {
      ...(this.accumulate ? this.queryTree.filters:null),
      ...filter
    }
    this.last_col = null;
    this.accumulate = false;
    return this;
  }


  this.ref = function (id) {
    this.queryTree.filters.id = id;
    return this;
  };

  this.page = function (page) {
    if (isNaN(page)) {
      throw new Error("Page must be a valid number");
    }
    this.queryTree.page = parseInt(page);
    return this;
  };


  this.search = function (col,keyword) {
    if (!col) {
      throw new Error("Page must be a valid number");
    }
    this.queryTree.query = {
      col: Graph.validColOnly(col),
      keyword
    };
    return this;
  };

  this.selectOne = function (...columns) {
    this.queryTree.service_method = "getOne";
    this.fetch(...columns);
    return this;
  };
  this.selectAll = function (...columns) {
    this.queryTree.service_method = "getAll";
    this.fetch(...columns);
    return this;
  };

  this.getOne = function (...columns) {
    this.queryTree.service_method = "getOne";
    this.fetch(...columns);
    return this.get();
  };
  this.getAll = function (...columns) {
    this.queryTree.service_method = "getAll";
    this.fetch(...columns);
    return this.get();
  };

  this.func = function (func) {
    if (!func) throw new Error("Specify fetch method");
    this.queryTree.service_method = func;
    return this;
  };

  this.fetch = function (...columns) {
    columns = columns.map((column) =>
      typeof column == "string" ? Graph.Column(column) : column
    );
    this.queryTree.columns = columns;
    return this;
  };

  this.as = function (alias) {
    this.queryTree.alias = alias;
    return {
      name: alias,
      type: "instance",
      method: this.queryTree.service_method,
      service: this.queryTree.service_name,
      page: this.queryTree.page,
      columns: this.queryTree.columns,
      params: this.queryTree.params,
      query: this.queryTree.query,
      filters: this.queryTree.filters,
      post_params: this.queryTree.post_params,
      tree: this.queryTree,
    };
  };

  this.getCacheHash = function(){
      return md5(JSON.stringify(this.queryTree));
  };

  let paramsToStr = function (params) {
    return JSON.stringify(params);
  };
  let formDataToObj = function (formData) {
    let object = {};
    formData.forEach(function (value, key) {
      object[key] = value;
    });
    return object
  }

  /**
   * @return {string}
   */
  let columnToStr = function (root, columns) {
    let str = "";
    if (columns.length) {
      for (let index in columns) {
        let column = columns[index];
        //  generate params
        if (column.type === "column") {
          str += "&" + root + `[${column.name}][type]=column`;
        } else if (column.type === "instance") {
          str += `&${root}[${column.name}][type]=service`;
          if (column.method) {
            str += `&${root}[${column.name}][func]=${column.method}`;
          }
          if (column.query) {
            str += `&${root}[${column.name}][query]=${column.query}`;
          }
          str += `&${root}[${column.name}][service]=${column.service}`;
          str += `&${root}[${column.name}][page]=${column.page}`;
          if(column.query){
            str += `&${root}[${column.name}][query]=${paramsToStr(column.query)}`;
          }
          if(Object.keys(column.filters).length){
            str += `&${root}[${column.name}][filters]=${paramsToStr(
                column.filters
            )}`;
          }
          if(Object.keys(column.params).length){
            str += `&${root}[${column.name}][params]=${paramsToStr(
                column.params
            )}`;
          }
          str += columnToStr(
            `${root}[${column.name}][columns]`,
            column.columns
          );
        }
        //${treeToStr(column.tree)}
      }
    }
    return str;
  };

  let treeToStr = function (queryTree, root = null) {
    let query = "";
    let _root = "";
    if (queryTree.service_method) {
      query += `${queryTree.service_name}[func]=${queryTree.service_method}`;
    }
    query += `&${queryTree.service_name}[service]=${queryTree.service_name}`;
    query += `&${queryTree.service_name}[type]=service`;
    query += `&${queryTree.service_name}[page]=${queryTree.page}`;
    if(Object.keys(queryTree.params).length){
      query += `&${queryTree.service_name}[params]=${paramsToStr(
          queryTree.params
      )}`;
    }
    if(queryTree.query){
      query += `&${queryTree.service_name}[query]=${paramsToStr(
          queryTree.query
      )}`;
    }
    if(Object.keys(queryTree.filters).length){
      query += `&${queryTree.service_name}[filters]=${paramsToStr(
          queryTree.filters
      )}`;
    }
    _root = `${queryTree.service_name}[columns]`;
    query += columnToStr(_root, queryTree.columns);
    return query;
  };

  this.toLink = function () {
    // console.log(JSON.stringify(this.queryTree))
    if (!this.queryTree.service_name) throw new Error("Service not specified");

    return treeToStr(this.queryTree, null) + (this.auto_link ? '&auto_link=yes' : '');
  };
  let makeRequest = function (endpoint, method = 'get', params = {}) {

    let req = axios.create(Graph.requestConfig);
    return new Promise(async (resolve, reject) => {
      try {
        let res = await req[method](endpoint, params);
        res = res.data;
        resolve(new Response(res));
      } catch (e) {
        let res = {
          data: null,
          msg: "",
          status: 0,
        };
        res = {
          ...res,
          network_msg: e.message,
        };
        if (typeof e.response !== "undefined") {
          res = {
            ...res,
          };
          //            status: e.response.status,
          if (typeof e.response.status !== "undefined") {
            res["status"] = e.response.status;
          }
          if (typeof e.response.data !== "undefined") {
            res = {
              ...res,
              ...e.response.data,
            };
          }
        }
        reject(new Response(res));
      }
    });
  };
  this.get = async function () {
    let link = Graph.endpoint + '?' + this.toLink()
    return makeRequest(link, 'get');
  };

  this.post = function (values = {}) {
    return this.set(values);
  };

  this.delete = async function () {

    let link = Graph.endpoint + '?' + this.toLink();
    return makeRequest(link, 'delete');
  };


  this.set = async function (values = {}) {
    this.queryTree.post_params = values;
    let link = Graph.endpoint + '?' + this.toLink();
    return makeRequest(link, 'post', FormBuild(this.queryTree.post_params));
  };

  this.update = async function (values = {}) {
    this.queryTree.post_params = values;
    let link = Graph.endpoint + '?' + this.toLink() + '&_method=PATCH';
    return makeRequest(link, 'post', FormBuild(this.queryTree.post_params));
  };

  this.params = function (params) {
    this.queryTree.params = params;
    return this;
  };
}

export {
  Graph
};

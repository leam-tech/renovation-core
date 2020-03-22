export interface LoadTranslationsParams {
  lang?: string;
}

export interface GetMessageParams {
  txt: string;
  lang?: string;
}

export interface SetMessagesDictParams {
  dict: { [x: string]: string };
  lang?: string;
}

export interface ExtendDictParams {
  dict: { [x: string]: string };
  lang?: string;
}

export interface SetCurrentLanguageParams {
  lang: string;
}

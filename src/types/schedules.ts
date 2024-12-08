export interface Schedules {
  meta: Meta;
  data: ProgramData[];
}

type Meta = {
  page_idx: number;
  region_id: string | null;
  key: string[];
  row_limit: number;
  cur_area_id: string | null;
  suisengo: string;
  area_id: string[];
  searched_url: string;
  end_day: string;
  filter: string | null;
  start_day: string;
  result_count: number;
  genre_id: string[];
  kakuchou: string[];
  station_id: string[];
};

type GenreDetail = {
  name: string;
  id: string;
};

type Genre = {
  personality: GenreDetail;
  program: GenreDetail;
};

type MetaInfo = {
  value: string;
  name: string;
};

type ProgramData = {
  start_time: string;
  genre: Genre;
  program_date: string;
  title: string;
  end_time: string;
  description: string;
  info: string;
  ts_in_ng: number;
  ts_out_ng: number;
  performer: string;
  end_time_s: string;
  start_time_s: string;
  station_id: string;
  program_url: string;
  img: string;
  status: string;
  metas: MetaInfo[];
};

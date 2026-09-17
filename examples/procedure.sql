-- Formatting fixture only; executing creates a procedure in the selected database.
create procedure dbo.FormatterExample @minimumId int as
begin
set nocount on;
select object_id,name,type_desc from sys.objects where object_id>=@minimumId and is_ms_shipped=0 order by name;
end
GO
